import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux';
import DashSidebar from '../components/WaiterDash/DashSidebar';
import WaiterDashboardMain from '../components/WaiterDash/DashboardMain';
import DashOrders from '../components/WaiterDash/DashOrders';
import DashWaiterCalls from '../components/WaiterDash/DashWaiterCalls';
import NotFound from './NotFound';

export default function WaiterDashboard() {

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
            navigate(`/waiter-dashboard?tab=dashboard`);
            setTab('dashboard');
        }
    }, [location.search, navigate]);

    const renderTabContent = () => {
        if (currentUser.isWaiter && tab === 'dashboard') return <WaiterDashboardMain />;
        if (currentUser.isWaiter && tab === 'waiter-calls') return <DashWaiterCalls />;
        if (currentUser.isWaiter && tab === 'orders') return <DashOrders />;
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
