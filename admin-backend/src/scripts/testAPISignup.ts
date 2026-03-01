import axios from 'axios';

const testSignup = async () => {
  try {
    console.log('Testing admin signup...');
    
    const response = await axios.post('http://localhost:3001/api/admin/signup', {
      email: 'test@example.com',
      password: 'test123',
      name: 'Test User',
      role: 'OPS'
    });
    
    console.log('Signup successful!');
    console.log('Response:', response.data);
    
    if (response.data.success) {
      console.log('User created:', response.data.data);
    }
  } catch (error: any) {
    console.error('Signup failed!');
    console.error('Error:', error.response?.data || error.message);
  }
};

testSignup();