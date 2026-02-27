import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { authApi, facilityApi, bookingApi, ticketApi } from '@/lib/api';
import type { User, Facility, Booking, Ticket } from '@/lib/types';
import {
  Shield, Users, Building2, CalendarDays, Ticket as TicketIcon,
  BarChart3, PieChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend } from 'recharts';


export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [roleModal, setRoleModal] = useState<{ userId: string; currentRoles: string[] } | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      authApi.getUsers(),
      facilityApi.getAll(),
      bookingApi.getAll(),
      ticketApi.getAll(),
    ]).then(([usersRes, facRes, bookRes, tickRes]) => {
      setUsers(usersRes.data);
      setFacilities(facRes.data);
      setBookings(bookRes.data);
      setTickets(tickRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isAdmin]);

  const handleUpdateRoles = async () => {
    if (!roleModal) return;
    try {
      await authApi.updateUserRoles(roleModal.userId, selectedRoles);
      const res = await authApi.getUsers();
      setUsers(res.data);
      setRoleModal(null);
    } catch {
      alert('Failed to update roles');
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Admin access required</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Analytics data
  const bookingStatusData = [
    { name: 'Pending', value: bookings.filter(b => b.status === 'PENDING').length, color: '#f59e0b' },
    { name: 'Approved', value: bookings.filter(b => b.status === 'APPROVED').length, color: '#10b981' },
    { name: 'Rejected', value: bookings.filter(b => b.status === 'REJECTED').length, color: '#ef4444' },
    { name: 'Cancelled', value: bookings.filter(b => b.status === 'CANCELLED').length, color: '#6b7280' },
  ].filter(d => d.value > 0);

  const ticketPriorityData = [
    { name: 'Critical', value: tickets.filter(t => t.priority === 'CRITICAL').length, color: '#ef4444' },
    { name: 'High', value: tickets.filter(t => t.priority === 'HIGH').length, color: '#f97316' },
    { name: 'Medium', value: tickets.filter(t => t.priority === 'MEDIUM').length, color: '#f59e0b' },
    { name: 'Low', value: tickets.filter(t => t.priority === 'LOW').length, color: '#6b7280' },
  ].filter(d => d.value > 0);

  const facilityTypeData = facilities.reduce((acc, f) => {
    const type = f.type.replace(/_/g, ' ');
    const existing = acc.find(a => a.name === type);
    if (existing) existing.value++;
    else acc.push({ name: type, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-violet-600" /> Admin Panel
        </h1>
        <p className="text-slate-500 text-sm mt-1">System overview and management</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Users', value: users.length, icon: Users, color: 'from-violet-500 to-indigo-500' },
              { label: 'Facilities', value: facilities.length, icon: Building2, color: 'from-blue-500 to-cyan-500' },
              { label: 'Bookings', value: bookings.length, icon: CalendarDays, color: 'from-emerald-500 to-teal-500' },
              { label: 'Tickets', value: tickets.length, icon: TicketIcon, color: 'from-amber-500 to-orange-500' },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Facility Types</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={facilityTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Booking Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RPieChart>
                  <Pie data={bookingStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">User</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Roles</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Provider</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                            {u.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <span className="text-sm font-medium text-slate-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(u.roles || []).map((role: string) => (
                            <span key={role} className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              role === 'ADMIN' ? 'bg-violet-100 text-violet-700' :
                              role === 'TECHNICIAN' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                            }`}>{role}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {(u as unknown as { provider?: string }).provider || 'LOCAL'}
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => { setRoleModal({ userId: u.id, currentRoles: u.roles || [] }); setSelectedRoles([...(u.roles || [])]); }}
                          className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-medium rounded-lg hover:bg-violet-100 border border-violet-200">
                          Edit Roles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Edit Modal */}
          {roleModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRoleModal(null)}>
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Edit User Roles</h3>
                <div className="space-y-3 mb-6">
                  {['USER', 'ADMIN', 'TECHNICIAN', 'MANAGER'].map(role => (
                    <label key={role} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={selectedRoles.includes(role)}
                        onChange={e => {
                          if (e.target.checked) setSelectedRoles([...selectedRoles, role]);
                          else setSelectedRoles(selectedRoles.filter(r => r !== role));
                        }}
                        className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500" />
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        role === 'ADMIN' ? 'bg-violet-100 text-violet-700' :
                        role === 'TECHNICIAN' ? 'bg-amber-100 text-amber-700' :
                        role === 'MANAGER' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>{role}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={handleUpdateRoles} disabled={selectedRoles.length === 0}
                    className="flex-1 py-2.5 gradient-primary text-white font-medium rounded-xl disabled:opacity-50">
                    Update Roles
                  </button>
                  <button onClick={() => setRoleModal(null)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Ticket Priority Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RPieChart>
                  <Pie data={ticketPriorityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {ticketPriorityData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RPieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                {[
                  { label: 'Active Facilities', value: facilities.filter(f => f.status === 'ACTIVE').length, total: facilities.length, color: 'bg-emerald-500' },
                  { label: 'Pending Bookings', value: bookings.filter(b => b.status === 'PENDING').length, total: bookings.length, color: 'bg-amber-500' },
                  { label: 'Open Tickets', value: tickets.filter(t => t.status === 'OPEN').length, total: tickets.length, color: 'bg-blue-500' },
                  { label: 'Critical Tickets', value: tickets.filter(t => t.priority === 'CRITICAL').length, total: tickets.length, color: 'bg-rose-500' },
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{stat.label}</span>
                      <span className="font-medium text-slate-900">{stat.value}/{stat.total}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${stat.color} transition-all`}
                        style={{ width: `${stat.total > 0 ? (stat.value / stat.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
