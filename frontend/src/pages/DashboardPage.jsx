import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DashSidebar from '../components/DashSidebar';
import DashProfile from '../components/DashProfile';
import DashAdvertisements from '../components/DashAdvertisements';
import DashUsers from '../components/DashUsers';
import DashComments from '../components/DashComments';
import DashboardMain from '../components/DashboardMain';
import { useSelector } from 'react-redux';
import NotFound from './NotFound';
import DashReservations from '../components/DashReservations';
import DashBookings from '../components/DashBookings';
import DashFeedbacks from '../components/DashFeedbacks';
import DashSettings from '../components/DashSettings';

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
    }
    if (!currentUser.isAdmin && tab !== 'profile' && tab !== 'bookings') {
      if (tab === 'profile') {
        navigate(`/dashboard?tab=profile`);
        setTab('profile');
      }
      else if (tab === 'bookings') {
        navigate(`/dashboard?tab=bookings`);
        setTab('bookings');
      }
    }
  }, [location.search]);

  const renderTabContent = () => {
/*     if (!currentUser.isAdmin && tab === 'bookings') return <DashBookings />;
 */    if (tab === 'profile') return <DashProfile />;
/*     if (currentUser.isAdmin && tab === 'advertisements') return <DashAdvertisements />;
    if (currentUser.isAdmin && tab === 'users') return <DashUsers />;
    if (currentUser.isAdmin && tab === 'comments') return <DashComments />;
    if (currentUser.isAdmin && tab === 'dashboard') return <DashboardMain />;
    if (currentUser.isAdmin && tab === 'reservations') return <DashReservations />;
    if (currentUser.isAdmin && tab === 'feedbacks') return <DashFeedbacks />;
    if (currentUser.isAdmin && tab === 'settings') return <DashSettings />;
 */    return <NotFound />;
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
