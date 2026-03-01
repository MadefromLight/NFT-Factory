import axios from 'axios';

const testLogin = async () => {
  try {
    console.log('Testing admin login...');
    
    const response = await axios.post('http://localhost:3001/api/admin/login', {
      email: 'abimbola.zeuslabs@gmail.com',
      password: 'AbimbolaTheFounder18'
    });
    
    console.log('Login successful!');
    console.log('Response:', response.data);
    
    if (response.data.success) {
      console.log('Token:', response.data.data.token);
      console.log('User:', response.data.data.user);
    }
  } catch (error: any) {
    console.error('Login failed!');
    console.error('Error:', error.response?.data || error.message);
  }
};

testLogin();