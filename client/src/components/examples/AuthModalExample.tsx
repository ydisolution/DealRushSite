import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AuthModal from '../AuthModal';

export default function AuthModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setIsOpen(true)}>פתח חלון התחברות</Button>
      <AuthModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onLogin={(email, password) => console.log('Login:', email, password)}
        onRegister={(name, email, password) => console.log('Register:', name, email, password)}
      />
    </div>
  );
}
