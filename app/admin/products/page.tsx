'use client'

import { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ShoppingBag, Plus, Edit, Trash2 } from 'lucide-react'

interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  image_url: string | null
  stock: number
  created_at: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    stock: '',
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch(
        apiUrl('/api/admin/products'),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) {
        if (response.status === 403) {
          window.location.href = '/dashboard'
          return
        }
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    
    try {
      const url = editingProduct
        ? apiUrl('/api/admin/products/${editingProduct.id}')
        : apiUrl('/api/admin/products')
      
      const method = editingProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setEditingProduct(null)
        setFormData({
          name: '',
          description: '',
          price: '',
          category: '',
          image_url: '',
          stock: '',
        })
        fetchProducts()
      }
    } catch (err) {
      console.error('Error saving product:', err)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category || '',
      image_url: product.image_url || '',
      stock: product.stock.toString(),
    })
    setShowForm(true)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Gestione Catalogo
            </h1>
            <p className="text-text-secondary">
              Gestisci i prodotti del catalogo
            </p>
          </div>
          <Button onClick={() => {
            setEditingProduct(null)
            setFormData({
              name: '',
              description: '',
              price: '',
              category: '',
              image_url: '',
              stock: '',
            })
            setShowForm(true)
          }}>
            <Plus size={18} className="mr-2" />
            Nuovo Prodotto
          </Button>
        </div>

        {showForm && (
          <Card>
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              {editingProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Descrizione"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Prezzo (€)"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
                <Input
                  label="Stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Categoria"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <Input
                label="URL Immagine"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
              <div className="flex gap-3">
                <Button type="submit">
                  {editingProduct ? 'Salva Modifiche' : 'Crea Prodotto'}
                </Button>
                <Button variant="secondary" onClick={() => {
                  setShowForm(false)
                  setEditingProduct(null)
                }}>
                  Annulla
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Categoria
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Prezzo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Stock
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-background">
                    <td className="py-4 px-4 font-medium text-text-primary">
                      {product.name}
                    </td>
                    <td className="py-4 px-4 text-text-secondary text-sm">
                      {product.category || '-'}
                    </td>
                    <td className="py-4 px-4 font-semibold text-text-primary">
                      €{parseFloat(product.price.toString()).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-text-secondary">
                      {product.stock}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 && (
            <div className="text-center py-12 text-text-secondary">
              <ShoppingBag className="mx-auto mb-4 text-text-secondary opacity-50" size={48} />
              <p>Nessun prodotto trovato</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

