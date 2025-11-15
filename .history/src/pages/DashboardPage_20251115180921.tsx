// src/pages/DashboardPage.tsx
import React from 'react';

function DashboardPage() {
  return (
    <div>
      <h1>User Dashboard</h1>
      <p>Welcome to your TapToSell Dashboard. Your content will be based on your role.</p>
      {/* Logged in state can be checked here */}
      {/* <p>Your role: {auth.user?.role}</p> */}
    </div>
  );
}

export default DashboardPage;