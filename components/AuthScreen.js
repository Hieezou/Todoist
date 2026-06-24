import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { impact, notification } from '../utils/haptics';

const AuthScreen = ({ mode, onSubmit, onSwitchMode, error, isSubmitting }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const nameInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmInputRef = useRef(null);

  const handlePress = useCallback(async () => {
    if (mode === 'signup' && password !== confirmPassword) {
      await notification();
      return;
    }
    await impact();
    onSubmit(name.trim(), email.trim(), password);
  }, [name, email, password, confirmPassword, mode, onSubmit]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>TODO</Text>
          <View style={styles.logoBlock}>
            <Text style={styles.logoBlockText}>IST</Text>
          </View>
        </View>
        <Text style={styles.title}>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'login'
            ? 'Log in to access your assignments.'
            : 'Sign up to save assignments with your own account.'}
        </Text>

        <View style={styles.form}>
          {mode === 'signup' && (
            <TextInput
              ref={nameInputRef}
              style={styles.input}
              autoCapitalize="words"
              placeholder="Full Name"
              placeholderTextColor="#8b8b8b"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
          )}
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#8b8b8b"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
          />
          <TextInput
            ref={passwordInputRef}
            style={styles.input}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor="#8b8b8b"
            value={password}
            onChangeText={setPassword}
            returnKeyType={mode === 'signup' ? 'next' : 'done'}
            onSubmitEditing={() => {
              if (mode === 'signup') {
                confirmInputRef.current?.focus();
              } else {
                handlePress();
              }
            }}
          />
          {mode === 'signup' && (
            <TextInput
              ref={confirmInputRef}
              style={styles.input}
              secureTextEntry
              placeholder="Confirm Password"
              placeholderTextColor="#8b8b8b"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={handlePress}
            />
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.submitButton} onPress={handlePress} disabled={isSubmitting}>
          <Text style={styles.submitButtonText}>{mode === 'login' ? 'Log in' : 'Sign up'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchButton} onPress={onSwitchMode}>
          <Text style={styles.switchButtonText}>
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Log in'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#111111',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#ff8c00',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#101010',
    fontWeight: '800',
    fontSize: 16,
  },
  switchButton: {
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#ffb347',
    fontWeight: '600',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  logoBlock: {
    marginLeft: 10,
    backgroundColor: '#ff8c00',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoBlockText: {
    color: '#101010',
    fontWeight: 'bold',
    fontSize: 30,
    letterSpacing: 0.6,
  },
  errorText: {
    color: '#ff8c00',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
});

export default AuthScreen;
