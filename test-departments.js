#!/usr/bin/env node

// Node 18+ 内置fetch支持
const fetch = globalThis.fetch || require('node-fetch');

async function testDepartmentAPI() {
  const baseURL = 'http://localhost:35001';
  
  console.log('🧪 测试部门API端点...\n');

  // 1. 测试健康检查
  try {
    console.log('1. 测试健康检查...');
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ 健康检查:', healthData.message);
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
    return;
  }

  // 2. 测试登录获取token
  let token;
  try {
    console.log('\n2. 测试登录...');
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '高春强' })
    });
    const loginData = await loginResponse.json();
    
    if (loginData.success && loginData.token) {
      token = loginData.token;
      console.log('✅ 登录成功');
    } else {
      console.log('❌ 登录失败:', loginData.message || loginData);
      return;
    }
  } catch (error) {
    console.log('❌ 登录失败:', error.message);
    return;
  }

  // 3. 测试获取部门列表
  try {
    console.log('\n3. 测试获取部门列表...');
    const departmentsResponse = await fetch(`${baseURL}/api/departments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const departmentsData = await departmentsResponse.json();
    
    if (departmentsData.success) {
      console.log('✅ 获取部门列表成功');
      console.log('📋 部门数量:', departmentsData.departments?.length || 0);
      departmentsData.departments?.forEach(dept => {
        console.log(`   - ${dept.name} (${dept.workerCount || 0}人)`);
      });
    } else {
      console.log('❌ 获取部门失败:', departmentsData.message);
    }
  } catch (error) {
    console.log('❌ 获取部门失败:', error.message);
  }

  // 4. 测试创建部门
  try {
    console.log('\n4. 测试创建部门...');
    const createResponse = await fetch(`${baseURL}/api/departments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ name: '测试部门', description: '自动化测试部门' })
    });
    const createData = await createResponse.json();
    
    if (createData.success) {
      console.log('✅ 创建部门成功:', createData.department.name);
    } else {
      console.log('❌ 创建部门失败:', createData.message);
    }
  } catch (error) {
    console.log('❌ 创建部门失败:', error.message);
  }

  console.log('\n🎯 测试完成！');
}

testDepartmentAPI();