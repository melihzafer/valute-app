import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/card'

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
          <p className="text-muted-foreground mb-6">Page not found</p>
          <Button onClick={() => navigate('/')} className="gap-2">
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotFoundPage
