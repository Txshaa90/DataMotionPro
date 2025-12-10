'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Check, Mail, Link as LinkIcon, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  datasetName: string
  datasetId: string
}

export function ShareDialog({ open, onOpenChange, datasetName, datasetId }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'view' | 'edit'>('view')
  const [invites, setInvites] = useState<Array<{ email: string; permission: 'view' | 'edit' }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const shareUrl = `${window.location.origin}/workspace/${datasetId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddInvite = () => {
    if (email && email.includes('@')) {
      setInvites([...invites, { email, permission }])
      setEmail('')
      setError('')
    }
  }

  const handleRemoveInvite = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index))
  }

  const handleSendInvites = async () => {
    if (invites.length === 0) return
    
    setLoading(true)
    setError('')
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to share datasets')
        setLoading(false)
        return
      }

      // Create share records in the database
      const shareRecords = invites.map(invite => ({
        table_id: datasetId,
        shared_with_email: invite.email,
        permission: invite.permission,
        shared_by: user.id,
        created_at: new Date().toISOString()
      }))

      const { error: insertError } = await (supabase as any)
        .from('table_shares')
        .insert(shareRecords)

      if (insertError) {
        // Check if it's a duplicate share error
        if (insertError.code === '23505' || insertError.message.includes('duplicate key')) {
          setError('One or more users already have access to this dataset. Please remove them from the list and try again.')
          setLoading(false)
          return
        }
        throw insertError
      }

      // Success! Show success message
      alert(`Successfully shared with ${invites.length} ${invites.length === 1 ? 'person' : 'people'}!\n\nThey will receive an email notification with access instructions.`)
      setInvites([])
      onOpenChange(false)
    } catch (err: any) {
      console.error('Error sharing dataset:', err)
      setError(err.message || 'Failed to share dataset. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share "{datasetName}"</DialogTitle>
          <DialogDescription>
            Share this dataset with others via link or email invitation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Copy Link Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Share Link
            </Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 bg-gray-50 dark:bg-gray-800"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Anyone with this link can view this dataset
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Or invite by email</span>
            </div>
          </div>

          {/* Email Invite Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Invite People
            </Label>
            
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddInvite()}
                className="flex-1"
                disabled={loading}
              />
              <Select value={permission} onValueChange={(v) => setPermission(v as 'view' | 'edit')} disabled={loading}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Can view</SelectItem>
                  <SelectItem value="edit">Can edit</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddInvite} variant="outline" disabled={loading}>
                Add
              </Button>
            </div>

            {/* Invited Users List */}
            {invites.length > 0 && (
              <div className="space-y-2 mt-3">
                <Label className="text-xs text-gray-500 flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  Pending Invites ({invites.length})
                </Label>
                <div className="border rounded-md divide-y max-h-[150px] overflow-y-auto">
                  {invites.map((invite, index) => (
                    <div key={index} className="flex items-center justify-between p-2 text-sm">
                      <div className="flex items-center gap-2 flex-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{invite.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 capitalize">{invite.permission}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInvite(index)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          {invites.length > 0 && (
            <Button onClick={handleSendInvites} className="flex items-center gap-2" disabled={loading}>
              <Mail className="h-4 w-4" />
              {loading ? 'Sending...' : `Send ${invites.length} Invite${invites.length > 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
