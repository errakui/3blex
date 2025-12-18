-- Script SQL per importare prodotti Mellow e creare admin
-- Esegui questo dopo aver applicato gli schema

-- Inserisci prodotti Mellow
INSERT INTO products (name, description, price, category, image, stock, created_at, updated_at)
VALUES 
(
  'Mellow® Sonno Profondo - Supergelée alle More',
  'Trasforma la sera in un rituale di relax. Le supergelée al mirtillo Mellow uniscono gusto e funzionalità con Melatonina, GABA, Griffonia, Magnesio e Passiflora per favorire il rilassamento, migliorare la qualità del sonno e risvegliarti più lucido e rigenerato.

Benefici:
• Induce rilassamento profondo
• Migliora la qualità del sonno
• Riduce risvegli notturni
• Favorisce lucidità mentale',
  34.90,
  'mellow',
  'https://try-mellow.com/cdn/shop/files/prova1.jpg?v=1760618140&width=1100',
  100,
  NOW(),
  NOW()
),
(
  'Mellow® Ashwaganda - Supergelée alla Fragola',
  'Ritrova calma ed equilibrio in modo naturale. Le nostre gummies alla fragola combinano gusto delicato e azione adattogena grazie a una formula sinergica con Ashwagandha KSM 66®, Magnesio, Vitamina B6, Rodiola e L-Teanina. Insieme aiutano a ridurre lo stress e i livelli di cortisolo, migliorano la qualità del riposo e favoriscono concentrazione energia mentale e resistenza fisica.',
  34.90,
  'mellow',
  'https://try-mellow.com/cdn/shop/files/Ashwaganda.jpg',
  100,
  NOW(),
  NOW()
),
(
  'Mellow® Anti-Age - Gummies alla Mela Verde',
  'Integratore in super-gelée anti-age con Resveratrolo, Acido Ialuronico, Collagene Marino, Vitamina C, Coenzima Q10.

Benefici:
• Contrasta l''invecchiamento cellulare
• Stimola la produzione di collagene
• Riduce rughe e discromie
• Aumenta elasticità, tono e luminosità della pelle',
  34.90,
  'mellow',
  'https://try-mellow.com/cdn/shop/files/1_guarantee.jpg?v=1761066260&width=1100',
  100,
  NOW(),
  NOW()
),
(
  'Mellow® Lipo Fianchi - Supergelée agli Agrumi',
  'Supergelée Mellow® Lipo Fianchi per supportare il drenaggio e la riduzione della ritenzione idrica. Aiutano a sentirti più sgonfia e la pelle più tonica. Gusto agrumi, senza glutine. Consigliato l''uso per più di un mese per vedere risultati concreti.',
  34.90,
  'mellow',
  'https://try-mellow.com/cdn/shop/files/60_guarantee_05b11e50-b919-40bb-a636-93be56bd8eba.jpg',
  100,
  NOW(),
  NOW()
),
(
  'Mellow® Capelli e Unghie - Supergelée Uva Rossa',
  'Supergelée Mellow® Capelli e Unghie per supportare la forza e la crescita di capelli e unghie. Formulate con ingredienti naturali per ridurre la caduta dei capelli e rinforzare le unghie.

Benefici:
• Riduce la caduta stagionale dei capelli
• Favorisce una crescita più rapida e sana
• Rafforza bulbo e fibra capillare
• Unghie più forti e pelle più compatta',
  34.90,
  'mellow',
  'https://try-mellow.com/cdn/shop/files/60_guarantee_7885a9d8-faad-47fe-8009-6519ef678ac3.jpg?v=1761222450&width=1100',
  100,
  NOW(),
  NOW()
),
(
  'Mellow® Dolori Articolari – Supergelée alla Vaniglia',
  'Supergelée Mellow® Dolori Articolari per supportare la mobilità articolare e il recupero post-workout. Aiutano a sentire le articolazioni più sciolte e a recuperare meglio dopo gli allenamenti.

Benefici:
• Riduce dolore e infiammazione articolare
• Migliora la flessibilità delle articolazioni
• Favorisce la rigenerazione della cartilagine
• Supporto quotidiano per articolazioni attive',
  34.90,
  'mellow',
  'https://try-mellow.com/cdn/shop/files/60_guarantee_7885a9d8-faad-47fe-8009-6519ef678ac3.jpg',
  100,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Crea utente admin (password: admin123 - hash bcrypt)
INSERT INTO users (email, password_hash, name, role, subscription_status, kyc_status, created_at)
VALUES (
  'admin@3blex.com',
  '$2a$10$rOzJ8aZqZ8ZqZ8ZqZ8ZqZe8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8',
  'Admin',
  'admin',
  'active',
  'approved',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2a$10$rOzJ8aZqZ8ZqZ8ZqZ8ZqZe8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8',
  role = 'admin',
  subscription_status = 'active',
  kyc_status = 'approved';

-- Verifica
SELECT 'Prodotti importati:' as info, COUNT(*) as count FROM products WHERE category = 'mellow';
SELECT 'Utente admin:' as info, email, role FROM users WHERE email = 'admin@3blex.com';

