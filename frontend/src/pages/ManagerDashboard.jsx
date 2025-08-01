import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux';
import DashSidebar from '../components/ManagerDash/DashSidebar';
import ManagerDashboardMain from '../components/ManagerDash/DashboardMain';
import NotFound from './NotFound';
import DashProducts from '../components/ManagerDash/DashProducts';
import DashCategories from '../components/ManagerDash/DashCategories';
import DashTables from '../components/ManagerDash/DashTables';

export default function ManagerDashboard() {

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
            navigate(`/manager-dashboard?tab=dashboard`);
            setTab('dashboard');
        }
    }, [location.search, navigate]);

    const renderTabContent = () => {
        if (currentUser.isManager && tab === 'dashboard') return <ManagerDashboardMain />;
        if (currentUser.isManager && tab === 'products') return <DashProducts />;
        if (currentUser.isManager && tab === 'categories') return <DashCategories />;
        if (currentUser.isManager && tab === 'tables') return <DashTables />;
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
