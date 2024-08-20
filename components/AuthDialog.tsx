'use client'

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"

export function AuthDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>Sign in to E2B</DialogTitle>
        <Button
          onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
          className="w-full"
        >
          Sign in with Microsoft
        </Button>
      </DialogContent>
    </Dialog>
  )
}