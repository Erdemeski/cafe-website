import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux';
import DashSidebar from '../components/AdminDash/DashSidebar';
import DashUsers from '../components/AdminDash/DashUsers';
import AdminDashboardMain from '../components/AdminDash/DashboardMain';
import NotFound from './NotFound';
import DashSettings from '../components/AdminDash/DashSettings';

export default function DashboardPage() {

    const { currentUser } = useSelector((state) => state.user)
    const location = useLocation();
    const [tab, setTab] = useState('')
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search)
        const tabFromUrl = urlParams.get('tab')
        if (tabFromUrl) {
            setTab(tabFromUrl);
        } else {
            navigate(`/admin-dashboard?tab=dashboard`);
            setTab('dashboard');
        }
    }, [location.search, navigate]);

    const renderTabContent = () => {
        if (currentUser.isAdmin && tab === 'users') return <DashUsers />;
        if (currentUser.isAdmin && tab === 'dashboard') return <AdminDashboardMain />;
        if (currentUser.isAdmin && tab === 'settings') return <DashSettings />;
        return <NotFound />;
    }

    return (
        <div className='min-h-screen flex flex-col md:flex-row'>
            <div className='md:w-56 z-20'>
                <DashSidebar />
            </div>
            {renderTabContent()}
        </div>
    )
}
