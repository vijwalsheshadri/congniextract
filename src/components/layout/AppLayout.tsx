import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
