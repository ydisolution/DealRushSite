import Header from '../Header';

export default function HeaderExample() {
  return (
    <Header 
      isLoggedIn={false}
      notificationCount={0}
      onLogin={() => console.log('Login clicked')}
      onLogout={() => console.log('Logout clicked')}
    />
  );
}
