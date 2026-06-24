import * as FileSystem from 'expo-file-system';

const USERS_FILE = FileSystem.documentDirectory + 'todoist_users.json';
const SESSION_FILE = FileSystem.documentDirectory + 'todoist_session.json';

const readFileJson = async (path) => {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const contents = await FileSystem.readAsStringAsync(path, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return contents ? JSON.parse(contents) : null;
  } catch (error) {
    console.warn(`authService read failed for ${path}:`, error.message);
    return null;
  }
};

const writeFileJson = async (path, value) => {
  try {
    await FileSystem.writeAsStringAsync(path, JSON.stringify(value), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    console.error(`authService write failed for ${path}:`, error.message);
    throw error;
  }
};

export const getCurrentUser = async () => {
  return await readFileJson(SESSION_FILE);
};

export const signUp = async (email, password, name = '') => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const normalizedEmail = email.trim().toLowerCase();
  const users = (await readFileJson(USERS_FILE)) || [];
  if (users.find((user) => user.email === normalizedEmail)) {
    throw new Error('This email is already registered');
  }

  const newUser = {
    id: `${Date.now()}-${Math.random()}`,
    email: normalizedEmail,
    password,
    name: name.trim() || normalizedEmail.split('@')[0] || 'Todoist User',
  };

  const updatedUsers = [...users, newUser];
  await writeFileJson(USERS_FILE, updatedUsers);
  await writeFileJson(SESSION_FILE, newUser);
  return newUser;
};

export const signIn = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const normalizedEmail = email.trim().toLowerCase();
  const users = (await readFileJson(USERS_FILE)) || [];
  const user = users.find(
    (u) => u.email === normalizedEmail && u.password === password
  );
  if (!user) {
    throw new Error('Invalid email or password');
  }

  await writeFileJson(SESSION_FILE, user);
  return user;
};

export const signOut = async () => {
  try {
    await FileSystem.deleteAsync(SESSION_FILE, { idempotent: true });
  } catch (error) {
    console.warn('authService signOut failed:', error.message);
  }
};
