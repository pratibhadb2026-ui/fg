async function verifyAPI() {
  console.log('Testing Admin Login & API Endpoints...');

  try {
    // 1. Admin Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    console.log('Login Result Status:', loginRes.status, loginData.user ? loginData.user.name : loginData);

    const token = loginData.token;

    // 2. Mark Attendance for Junior 1
    const attRes = await fetch('http://localhost:5000/api/attendance/mark-cat-b', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId: 'junior1', status: 'Present' })
    });
    const attData = await attRes.json();
    console.log('Mark Attendance Result Status:', attRes.status, attData);

    // 3. Assign Task to Junior 1
    const taskRes = await fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'New Production Task',
        description: 'Testing task assignment via API',
        assignedTo: 'junior1',
        priority: 'High',
        deadline: '2026-08-25'
      })
    });
    const taskData = await taskRes.json();
    console.log('Assign Task Result Status:', taskRes.status, taskData);

  } catch (err) {
    console.error('API Verification Error:', err);
  }
}

verifyAPI();
