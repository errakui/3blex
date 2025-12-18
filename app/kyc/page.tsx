'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileCheck, Upload, CheckCircle, Clock, X, User, MapPin } from 'lucide-react'
import { apiUrl } from '@/lib/api'

interface DocumentInfo {
  status: string
  filePath?: string
  documentType?: string
  documentNumber?: string
  selfiePath?: string
  proofOfAddressPath?: string
  addressDocumentType?: string
  rejectionReason?: string
  reviewedAt?: string
}

interface KYCData {
  kycStatus: string
  documents: {
    document?: DocumentInfo
    selfie?: DocumentInfo
    proof_of_address?: DocumentInfo
  }
}

export default function KYCPage() {
  const [kycData, setKycData] = useState<KYCData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)

  // Form state
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('id_card')
  const [documentNumber, setDocumentNumber] = useState('')
  const [documentExpiry, setDocumentExpiry] = useState('')

  const [selfieFile, setSelfieFile] = useState<File | null>(null)

  const [proofOfAddressFile, setProofOfAddressFile] = useState<File | null>(null)
  const [addressDocumentType, setAddressDocumentType] = useState('utility_bill')

  useEffect(() => {
    fetchKYCStatus()
  }, [])

  const fetchKYCStatus = async () => {
    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch(
        apiUrl('/api/kyc/status'),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const data = await response.json()
      if (data.success) {
        setKycData(data)
      }
    } catch (err) {
      console.error('Error fetching KYC:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (type: 'document' | 'selfie' | 'proofOfAddress') => {
    const token = localStorage.getItem('token')
    const formData = new FormData()

    if (type === 'document') {
      if (!documentFile) return
      formData.append('document', documentFile)
      formData.append('documentType', documentType)
      formData.append('documentNumber', documentNumber)
      if (documentExpiry) formData.append('documentExpiry', documentExpiry)
    } else if (type === 'selfie') {
      if (!selfieFile) return
      formData.append('selfie', selfieFile)
    } else if (type === 'proofOfAddress') {
      if (!proofOfAddressFile) return
      formData.append('proofOfAddress', proofOfAddressFile)
      formData.append('addressDocumentType', addressDocumentType)
    }

    setUploading(type)

    try {
      const response = await fetch(
        apiUrl('/api/kyc/upload'),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      const data = await response.json()

      if (data.success) {
        alert('✅ Documento caricato con successo!')
        fetchKYCStatus()
        
        // Reset form
        if (type === 'document') {
          setDocumentFile(null)
          setDocumentNumber('')
          setDocumentExpiry('')
        } else if (type === 'selfie') {
          setSelfieFile(null)
        } else {
          setProofOfAddressFile(null)
        }
      } else {
        alert('❌ Errore: ' + (data.message || 'Errore nel caricamento'))
      }
    } catch (err) {
      console.error('Error uploading document:', err)
      alert('❌ Errore nel caricamento del documento')
    } finally {
      setUploading(null)
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-500" size={24} />
      case 'pending':
      case 'in_review':
        return <Clock className="text-yellow-500" size={24} />
      case 'rejected':
        return <X className="text-red-500" size={24} />
      default:
        return <Clock className="text-gray-400" size={24} />
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'approved':
        return { text: 'Approvato', color: 'bg-green-100 text-green-600' }
      case 'pending':
      case 'in_review':
        return { text: 'In Verifica', color: 'bg-yellow-100 text-yellow-600' }
      case 'rejected':
        return { text: 'Rifiutato', color: 'bg-red-100 text-red-600' }
      default:
        return { text: 'Non Caricato', color: 'bg-gray-100 text-gray-600' }
    }
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

  const overallStatus = kycData?.kycStatus || 'pending'

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Verifica KYC
          </h1>
          <p className="text-text-secondary">
            Completa la verifica caricando documento identità, selfie e proof of address
          </p>
        </div>

        {/* Overall Status */}
        <Card>
          <div className="text-center py-6">
            <div className="flex justify-center mb-4">
              {overallStatus === 'approved' ? (
                <CheckCircle className="text-green-500" size={48} />
              ) : overallStatus === 'rejected' ? (
                <X className="text-red-500" size={48} />
              ) : (
                <Clock className="text-yellow-500" size={48} />
              )}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${
              overallStatus === 'approved' ? 'text-green-600' :
              overallStatus === 'rejected' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {overallStatus === 'approved' ? 'KYC Approvato' :
               overallStatus === 'rejected' ? 'KYC Rifiutato' :
               overallStatus === 'in_review' ? 'KYC In Verifica' :
               'KYC Non Completato'}
            </h2>
            <p className="text-text-secondary">
              {overallStatus === 'approved' ? 'Puoi prelevare le commissioni!' :
               overallStatus === 'rejected' ? 'Carica nuovi documenti per riprovare' :
               overallStatus === 'in_review' ? 'I documenti sono in fase di revisione' :
               'Carica tutti i documenti richiesti'}
            </p>
          </div>
        </Card>

        {/* Documento Identità */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <FileCheck className="text-primary" size={24} />
            <h3 className="text-lg font-semibold text-text-primary">
              1. Documento d'Identità
            </h3>
            {kycData?.documents.document && getStatusIcon(kycData.documents.document.status)}
          </div>

          {kycData?.documents.document?.status === 'approved' ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">✓ Documento approvato</p>
              {kycData.documents.document.documentType && (
                <p className="text-green-700 text-xs mt-1">
                  Tipo: {kycData.documents.document.documentType} | 
                  Numero: {kycData.documents.document.documentNumber || 'N/A'}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tipo di Documento
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="id_card">Carta d'Identità</option>
                  <option value="passport">Passaporto</option>
                  <option value="driving_license">Patente di Guida</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Numero Documento
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Inserisci il numero del documento"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Data di Scadenza (opzionale)
                </label>
                <input
                  type="date"
                  value={documentExpiry}
                  onChange={(e) => setDocumentExpiry(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  File Documento
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    id="document-upload"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                  <label htmlFor="document-upload" className="cursor-pointer">
                    {documentFile ? (
                      <div>
                        <CheckCircle className="mx-auto mb-2 text-primary" size={32} />
                        <p className="text-text-primary font-medium">{documentFile.name}</p>
                        <p className="text-text-secondary text-sm mt-1">
                          {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto mb-2 text-text-secondary" size={32} />
                        <p className="text-text-primary font-medium mb-1">
                          Clicca per caricare documento
                        </p>
                        <p className="text-text-secondary text-sm">
                          JPG, PNG, PDF (max 5MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {documentFile && (
                <Button
                  onClick={() => handleUpload('document')}
                  disabled={uploading === 'document' || !documentNumber}
                  className="w-full"
                >
                  {uploading === 'document' ? 'Caricamento...' : 'Carica Documento'}
                </Button>
              )}

              {kycData?.documents.document?.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">
                    <strong>Motivo rifiuto:</strong> {kycData.documents.document.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Selfie */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <User className="text-primary" size={24} />
            <h3 className="text-lg font-semibold text-text-primary">
              2. Selfie
            </h3>
            {kycData?.documents.selfie && getStatusIcon(kycData.documents.selfie.status)}
          </div>

          {kycData?.documents.selfie?.status === 'approved' ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">✓ Selfie approvato</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Foto Selfie (con documento visibile)
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    id="selfie-upload"
                    onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                    accept="image/*"
                    className="hidden"
                  />
                  <label htmlFor="selfie-upload" className="cursor-pointer">
                    {selfieFile ? (
                      <div>
                        <CheckCircle className="mx-auto mb-2 text-primary" size={32} />
                        <p className="text-text-primary font-medium">{selfieFile.name}</p>
                        <p className="text-text-secondary text-sm mt-1">
                          {(selfieFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto mb-2 text-text-secondary" size={32} />
                        <p className="text-text-primary font-medium mb-1">
                          Clicca per caricare selfie
                        </p>
                        <p className="text-text-secondary text-sm">
                          JPG, PNG (max 5MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {selfieFile && (
                <Button
                  onClick={() => handleUpload('selfie')}
                  disabled={uploading === 'selfie'}
                  className="w-full"
                >
                  {uploading === 'selfie' ? 'Caricamento...' : 'Carica Selfie'}
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Proof of Address */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="text-primary" size={24} />
            <h3 className="text-lg font-semibold text-text-primary">
              3. Proof of Address
            </h3>
            {kycData?.documents.proof_of_address && getStatusIcon(kycData.documents.proof_of_address.status)}
          </div>

          {kycData?.documents.proof_of_address?.status === 'approved' ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">✓ Proof of Address approvato</p>
              {kycData.documents.proof_of_address.addressDocumentType && (
                <p className="text-green-700 text-xs mt-1">
                  Tipo: {kycData.documents.proof_of_address.addressDocumentType}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tipo di Documento
                </label>
                <select
                  value={addressDocumentType}
                  onChange={(e) => setAddressDocumentType(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="utility_bill">Bolletta Luce/Gas/Acqua</option>
                  <option value="bank_statement">Estratto Conto Bancario</option>
                  <option value="tax_bill">Bolletta Tasse</option>
                  <option value="government_letter">Lettera Governativa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  File Documento
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    id="poa-upload"
                    onChange={(e) => setProofOfAddressFile(e.target.files?.[0] || null)}
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                  <label htmlFor="poa-upload" className="cursor-pointer">
                    {proofOfAddressFile ? (
                      <div>
                        <CheckCircle className="mx-auto mb-2 text-primary" size={32} />
                        <p className="text-text-primary font-medium">{proofOfAddressFile.name}</p>
                        <p className="text-text-secondary text-sm mt-1">
                          {(proofOfAddressFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto mb-2 text-text-secondary" size={32} />
                        <p className="text-text-primary font-medium mb-1">
                          Clicca per caricare proof of address
                        </p>
                        <p className="text-text-secondary text-sm">
                          JPG, PNG, PDF (max 5MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {proofOfAddressFile && (
                <Button
                  onClick={() => handleUpload('proofOfAddress')}
                  disabled={uploading === 'proofOfAddress'}
                  className="w-full"
                >
                  {uploading === 'proofOfAddress' ? 'Caricamento...' : 'Carica Proof of Address'}
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Info */}
        <Card className="bg-background">
          <h4 className="font-semibold text-text-primary mb-2">
            Perché serve la verifica KYC?
          </h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>• Verifica della tua identità per sicurezza</li>
            <li>• Necessaria per prelevare le commissioni</li>
            <li>• Protezione contro frodi e abusi</li>
            <li>• Conformità con le normative finanziarie</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  )
}
