/**
 * BinaryTreeService
 * Gestisce l'albero binario a due gambe secondo le specifiche 3blex.md
 */

const pool = require('../db/index');

class BinaryTreeService {
  
  /**
   * Trova il primo slot disponibile in una gamba usando BFS
   * @param {string} sponsorId - ID dello sponsor
   * @param {string} preferredLeg - 'left' | 'right' | 'auto'
   * @returns {Object} { parentId, position }
   */
  async findFirstAvailableSlot(sponsorId, preferredLeg = 'auto') {
    // Se auto, determina la gamba con meno volume
    if (preferredLeg === 'auto') {
      preferredLeg = await this.getWeakerLeg(sponsorId);
    }
    
    // Ottieni il nodo dello sponsor nell'albero binario
    const sponsorNode = await pool.query(
      `SELECT * FROM binary_tree WHERE user_id = $1`,
      [sponsorId]
    );
    
    if (sponsorNode.rows.length === 0) {
      throw new Error('Sponsor non trovato nell\'albero binario');
    }
    
    const sponsor = sponsorNode.rows[0];
    
    // Controlla se lo sponsor ha lo slot diretto libero
    if (preferredLeg === 'left' && !sponsor.left_child_id) {
      return { parentId: sponsor.id, position: 'left' };
    }
    if (preferredLeg === 'right' && !sponsor.right_child_id) {
      return { parentId: sponsor.id, position: 'right' };
    }
    
    // Altrimenti, usa BFS per trovare il primo slot libero nella gamba preferita
    const startChildId = preferredLeg === 'left' ? sponsor.left_child_id : sponsor.right_child_id;
    
    if (!startChildId) {
      // La gamba preferita è vuota, usa lo slot diretto
      return { parentId: sponsor.id, position: preferredLeg };
    }
    
    // BFS per trovare il primo slot libero
    const queue = [startChildId];
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      
      const currentNode = await pool.query(
        `SELECT * FROM binary_tree WHERE id = $1`,
        [currentId]
      );
      
      if (currentNode.rows.length === 0) continue;
      
      const node = currentNode.rows[0];
      
      // Controlla slot liberi
      if (!node.left_child_id) {
        return { parentId: node.id, position: 'left' };
      }
      if (!node.right_child_id) {
        return { parentId: node.id, position: 'right' };
      }
      
      // Aggiungi i figli alla coda (prima sinistro, poi destro)
      queue.push(node.left_child_id);
      queue.push(node.right_child_id);
    }
    
    throw new Error('Nessuno slot disponibile trovato');
  }
  
  /**
   * Determina la gamba più debole (con meno volume)
   * @param {string} userId - ID utente
   * @returns {string} 'left' | 'right'
   */
  async getWeakerLeg(userId) {
    const result = await pool.query(
      `SELECT left_volume, right_volume FROM binary_tree WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return 'left'; // Default a sinistra se l'utente non esiste
    }
    
    const { left_volume, right_volume } = result.rows[0];
    return parseFloat(left_volume || 0) <= parseFloat(right_volume || 0) ? 'left' : 'right';
  }
  
  /**
   * Posiziona un nuovo utente nell'albero binario
   * @param {string} userId - ID del nuovo utente
   * @param {string} sponsorId - ID dello sponsor
   * @param {string} preferredLeg - 'left' | 'right' | 'auto'
   * @returns {Object} Nodo creato
   */
  async placeUser(userId, sponsorId, preferredLeg = 'auto') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verifica che l'utente non sia già nell'albero
      const existing = await client.query(
        `SELECT id FROM binary_tree WHERE user_id = $1`,
        [userId]
      );
      
      if (existing.rows.length > 0) {
        throw new Error('Utente già posizionato nell\'albero binario');
      }
      
      // Trova lo slot disponibile
      const { parentId, position } = await this.findFirstAvailableSlot(sponsorId, preferredLeg);
      
      // Ottieni info sul parent
      const parentResult = await client.query(
        `SELECT depth, path FROM binary_tree WHERE id = $1`,
        [parentId]
      );
      const parent = parentResult.rows[0];
      
      // Crea il nuovo nodo
      const newNodeResult = await client.query(
        `INSERT INTO binary_tree (user_id, parent_id, position, depth, path)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          userId,
          parentId,
          position,
          (parent?.depth || 0) + 1,
          parent?.path ? `${parent.path}.${parentId}` : parentId
        ]
      );
      
      const newNode = newNodeResult.rows[0];
      
      // Aggiorna il parent con il riferimento al nuovo figlio
      if (position === 'left') {
        await client.query(
          `UPDATE binary_tree SET left_child_id = $1 WHERE id = $2`,
          [newNode.id, parentId]
        );
      } else {
        await client.query(
          `UPDATE binary_tree SET right_child_id = $1 WHERE id = $2`,
          [newNode.id, parentId]
        );
      }
      
      await client.query('COMMIT');
      
      return {
        node: newNode,
        parentId,
        position,
        isSpillover: parentId !== (await this.getNodeByUserId(sponsorId))?.id
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Crea il nodo root dell'albero (primo utente o azienda)
   * @param {string} userId - ID utente
   * @returns {Object} Nodo creato
   */
  async createRootNode(userId) {
    const result = await pool.query(
      `INSERT INTO binary_tree (user_id, depth, path)
       VALUES ($1, 0, '')
       RETURNING *`,
      [userId]
    );
    return result.rows[0];
  }
  
  /**
   * Ottieni il nodo dell'albero per un utente
   * @param {string} userId - ID utente
   * @returns {Object|null} Nodo o null
   */
  async getNodeByUserId(userId) {
    const result = await pool.query(
      `SELECT * FROM binary_tree WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }
  
  /**
   * Ottieni l'albero binario di un utente fino a N livelli
   * @param {string} userId - ID utente
   * @param {number} maxDepth - Profondità massima (default 5)
   * @returns {Object} Albero con struttura ricorsiva
   */
  async getTree(userId, maxDepth = 5) {
    const rootNode = await this.getNodeByUserId(userId);
    if (!rootNode) return null;
    
    return this.buildTreeRecursive(rootNode.id, 0, maxDepth);
  }
  
  /**
   * Costruisce l'albero ricorsivamente
   */
  async buildTreeRecursive(nodeId, currentDepth, maxDepth) {
    if (currentDepth > maxDepth) return null;
    
    const nodeResult = await pool.query(
      `SELECT bt.*, u.first_name, u.last_name, u.email, u.status, u.current_rank
       FROM binary_tree bt
       JOIN users u ON bt.user_id = u.id
       WHERE bt.id = $1`,
      [nodeId]
    );
    
    if (nodeResult.rows.length === 0) return null;
    
    const node = nodeResult.rows[0];
    
    const tree = {
      id: node.id,
      userId: node.user_id,
      name: `${node.first_name} ${node.last_name}`,
      email: node.email,
      status: node.status,
      rank: node.current_rank,
      position: node.position,
      depth: node.depth,
      leftVolume: parseFloat(node.left_volume) || 0,
      rightVolume: parseFloat(node.right_volume) || 0,
      personalVolume: parseFloat(node.personal_volume) || 0,
      left: null,
      right: null
    };
    
    // Carica figli ricorsivamente
    if (node.left_child_id) {
      tree.left = await this.buildTreeRecursive(node.left_child_id, currentDepth + 1, maxDepth);
    }
    if (node.right_child_id) {
      tree.right = await this.buildTreeRecursive(node.right_child_id, currentDepth + 1, maxDepth);
    }
    
    return tree;
  }
  
  /**
   * Aggiorna i volumi risalendo l'albero dopo un acquisto
   * @param {string} userId - ID utente che ha fatto l'acquisto
   * @param {number} pvAmount - PV dell'acquisto
   */
  async updateVolumes(userId, pvAmount) {
    // Usa la funzione SQL per efficienza
    await pool.query(
      `SELECT update_binary_volumes($1, $2)`,
      [userId, pvAmount]
    );
  }
  
  /**
   * Ottieni statistiche binarie di un utente
   * @param {string} userId - ID utente
   * @returns {Object} Statistiche
   */
  async getStats(userId) {
    const nodeResult = await pool.query(
      `SELECT bt.*, 
              (SELECT COUNT(*) FROM binary_tree WHERE path LIKE bt.path || '.%' OR parent_id = bt.id) as total_team,
              cl.left_carryover, cl.right_carryover
       FROM binary_tree bt
       LEFT JOIN carryover_ledger cl ON cl.user_id = bt.user_id
       WHERE bt.user_id = $1`,
      [userId]
    );
    
    if (nodeResult.rows.length === 0) {
      return null;
    }
    
    const node = nodeResult.rows[0];
    const leftVolume = parseFloat(node.left_volume) || 0;
    const rightVolume = parseFloat(node.right_volume) || 0;
    const weakerLeg = leftVolume <= rightVolume ? 'left' : 'right';
    const weakerLegVolume = Math.min(leftVolume, rightVolume);
    const strongerLegVolume = Math.max(leftVolume, rightVolume);
    
    return {
      leftVolume,
      rightVolume,
      personalVolume: parseFloat(node.personal_volume) || 0,
      groupVolume: leftVolume + rightVolume,
      weakerLeg,
      weakerLegVolume,
      strongerLegVolume,
      difference: strongerLegVolume - weakerLegVolume,
      balancePercentage: strongerLegVolume > 0 
        ? Math.round((weakerLegVolume / strongerLegVolume) * 100) 
        : 100,
      carryover: {
        left: parseFloat(node.left_carryover) || 0,
        right: parseFloat(node.right_carryover) || 0
      },
      totalTeam: parseInt(node.total_team) || 0,
      depth: node.depth
    };
  }
  
  /**
   * Conta i membri in una gamba
   * @param {string} userId - ID utente
   * @param {string} leg - 'left' | 'right'
   * @returns {number} Conteggio
   */
  async countLegMembers(userId, leg) {
    const node = await this.getNodeByUserId(userId);
    if (!node) return 0;
    
    const childId = leg === 'left' ? node.left_child_id : node.right_child_id;
    if (!childId) return 0;
    
    const result = await pool.query(
      `WITH RECURSIVE tree AS (
        SELECT id, left_child_id, right_child_id FROM binary_tree WHERE id = $1
        UNION ALL
        SELECT bt.id, bt.left_child_id, bt.right_child_id 
        FROM binary_tree bt
        JOIN tree t ON bt.parent_id = t.id
      )
      SELECT COUNT(*) as count FROM tree`,
      [childId]
    );
    
    return parseInt(result.rows[0].count) || 0;
  }
}

module.exports = new BinaryTreeService();
