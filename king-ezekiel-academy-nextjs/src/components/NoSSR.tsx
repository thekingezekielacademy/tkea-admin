'use client'

import dynamic from 'next/dynamic'
import { ReactNode, useEffect, useState } from 'react'

interface NoSSRProps {
  children: ReactNode
}

const NoSSR = ({ children }: NoSSRProps) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Remove browser extension attributes after mount
    const removeExtensionAttributes = () => {
      const elements = document.querySelectorAll('*')
      elements.forEach(el => {
        const attrsToRemove = [
          'bis_skin_checked',
          'bis_register',
          '__processed_46679056-0408-48ad-baf1-5de68dd9d5da__'
        ]
        attrsToRemove.forEach(attr => {
          if (el.hasAttribute(attr)) {
            el.removeAttribute(attr)
          }
        })
      })
    }

    // Run immediately and set up observer
    removeExtensionAttributes()
    
    // Wait for document.body to be ready
    const startObserver = () => {
      if (document.body) {
        const observer = new MutationObserver(removeExtensionAttributes)
        observer.observe(document.body, { 
          attributes: true, 
          childList: true, 
          subtree: true 
        })
        return observer
      } else {
        // Retry after a short delay
        setTimeout(startObserver, 100)
        return null
      }
    }
    
    const observer = startObserver()
    return () => observer?.disconnect()
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default dynamic(() => Promise.resolve(NoSSR), {
  ssr: false
})
