// Mock de autenticação para desenvolvimento sem API

const MOCK_USERS = [
  {
    id: 1,
    name: 'Administrador',
    email: 'admin@novaguardian.com',
    password: 'admin123',
    role: 'ADMIN',
  },
  {
    id: 2,
    name: 'Usuário Demo',
    email: 'user@example.com',
    password: 'user123',
    role: 'USER',
  },
];

export async function mockLogin(email, password) {
  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 500));

  const user = MOCK_USERS.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    throw new Error('Credenciais inválidas');
  }

  const { password: _, ...userWithoutPassword } = user;

  return {
    access_token: `mock_token_${user.id}_${Date.now()}`,
    user: userWithoutPassword,
  };
}

export async function mockGetMe(token) {
  await new Promise(resolve => setTimeout(resolve, 200));

  if (!token || !token.startsWith('mock_token_')) {
    throw new Error('Token inválido');
  }

  const userId = parseInt(token.split('_')[2]);
  const user = MOCK_USERS.find(u => u.id === userId);

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
