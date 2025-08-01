import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux';
import DashSidebar from '../components/ReceptionDash/DashSidebar';
import ReceptionDashboardMain from '../components/ReceptionDash/DashboardMain';
import DashReservations from '../components/ReceptionDash/DashReservations';
import NotFound from './NotFound';

export default function ReceptionDashboard() {

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
            navigate(`/reception-dashboard?tab=dashboard`);
            setTab('dashboard');
        }
    }, [location.search, navigate]);

    const renderTabContent = () => {
        if (currentUser.isReception && tab === 'dashboard') return <ReceptionDashboardMain />;
        if (currentUser.isReception && tab === 'reservations') return <DashReservations />;
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
