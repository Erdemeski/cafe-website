import React, { useEffect, useState } from 'react'
import { Button, Modal, Sidebar, Badge } from 'flowbite-react'
import { HiAnnotation, HiArrowSmLeft, HiArrowSmRight, HiChartPie, HiDocumentText, HiOutlineUserGroup, HiUser, HiClock, HiBell } from 'react-icons/hi'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signoutSuccess } from '../../redux/user/userSlice';
import { useDispatch, useSelector } from "react-redux";
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { HiBanknotes } from "react-icons/hi2";
import { MdOutlineCommentBank } from "react-icons/md";
import { IoIosMail } from "react-icons/io";
import { MdOutlineSettings } from "react-icons/md";
import { BiDish } from "react-icons/bi";
import { RiRestaurantLine } from "react-icons/ri";

export default function DashSidebar() {

    const location = useLocation();
    const [tab, setTab] = useState('')
    const [pendingOrders, setPendingOrders] = useState(0);
    const [pendingCalls, setPendingCalls] = useState(0);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search)
        const tabFromUrl = urlParams.get('tab')
        if (tabFromUrl) {
            setTab(tabFromUrl);
        }
    }, [location.search]);

    const dispatch = useDispatch();
    const [showSignout, setShowSignout] = useState(false);
    const { currentUser } = useSelector(state => state.user);
    const navigate = useNavigate();

    // Fetch pending counts
    const fetchPendingCounts = async () => {
        try {
            const [ordersResponse, callsResponse] = await Promise.all([
                fetch('/api/order'),
                fetch('/api/table/waiter-calls')
            ]);

            const ordersData = await ordersResponse.json();
            const callsData = await callsResponse.json();

            if (ordersResponse.ok) {
                const orders = ordersData.orders || [];
                const pendingOrdersCount = orders.filter(order => order.status === 'pending').length;
                setPendingOrders(pendingOrdersCount);
            }

            if (callsResponse.ok) {
                const calls = callsData.waiterCalls || [];
                const pendingCallsCount = calls.filter(call => call.status === 'pending').length;
                setPendingCalls(pendingCallsCount);
            }
        } catch (error) {
            console.error('Error fetching pending counts:', error);
        }
    };

    // Auto-refresh pending counts faster and on tab focus
    useEffect(() => {
        fetchPendingCounts();
        const interval = setInterval(fetchPendingCounts, 10000);
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') fetchPendingCounts();
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    const handleSignout = async () => {
        try {
            const res = await fetch('/api/user/signout', {
                method: 'POST',
            });
            const data = await res.json();
            if (!res.ok) {
                console.log(data.message);
            } else {
                dispatch(signoutSuccess());
                setShowSignout(false);
                navigate('/');
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    return (
        <div className='h-full'>
            <Sidebar
                className='w-full md:w-56 h-full'
                theme={{
                    root: {
                        inner: "h-full overflow-y-auto overflow-x-hidden rounded bg-gray-50 px-3 py-4 dark:bg-[rgb(32,38,43)] dark:border-b-2 dark:border-gray-700"
                    },
                    item: {
                        base: "flex items-center justify-center rounded-lg p-2 text-sm font-normal text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700",
                        active: "bg-gray-100 dark:bg-gray-700",
                        content: {
                            base: "flex-1 whitespace-nowrap pl-3"
                        },
                    },
                    itemGroup: {
                        base: "mt-2 space-y-2 border-t border-gray-200 pt-2 first:mt-0 first:border-t-0 first:pt-0 dark:border-gray-700"
                    }
                }}
            >
                <Sidebar.Items>
                    <Sidebar.ItemGroup className='flex flex-col gap-1'>
                        <Sidebar.Item icon={HiArrowSmLeft} className='cursor-pointer' onClick={() => navigate('/dashboard-director')}>Dashboard Director</Sidebar.Item>
                    </Sidebar.ItemGroup>
                    <Sidebar.ItemGroup className='flex flex-col gap-1'>
                        {currentUser && currentUser.isWaiter && (
                            <Link to='/waiter-dashboard?tab=dashboard'>
                                <Sidebar.Item active={tab === 'dashboard' || !tab} icon={HiChartPie} label={'Waiter'} labelColor={'red'} as='div'>Dashboard</Sidebar.Item>
                            </Link>
                        )}
                        {currentUser.isWaiter && (
                            <Link to='/waiter-dashboard?tab=orders'>
                                <Sidebar.Item active={tab === 'orders'} icon={RiRestaurantLine} as='div'>
                                    <div className='flex items-center justify-between w-full'>
                                        <span>Orders</span>
                                        {pendingOrders > 0 && (
                                            <Badge color="warning" size="sm" className='ml-2'>
                                                <span className='flex flex-row items-center gap-1'>
                                                    <HiClock className='h-3 w-3' /> {pendingOrders}
                                                </span>
                                            </Badge>
                                        )}
                                    </div>
                                </Sidebar.Item>
                            </Link>
                        )}
                        {currentUser.isWaiter && (
                            <Link to='/waiter-dashboard?tab=waiter-calls'>
                                <Sidebar.Item active={tab === 'waiter-calls'} icon={BiDish} as='div'>
                                    <div className='flex items-center justify-between w-full'>
                                        <span>Waiter Calls</span>
                                        {pendingCalls > 0 && (
                                            <Badge color="warning" size="sm" className='ml-2'>
                                                <span className='flex flex-row items-center gap-1'>
                                                    <HiBell className='h-3 w-3' /> {pendingCalls}
                                                </span>
                                            </Badge>
                                        )}
                                    </div>
                                </Sidebar.Item>
                            </Link>
                        )}
                    </Sidebar.ItemGroup>
                    <Sidebar.ItemGroup className='flex flex-col gap-1'>
                        <Sidebar.Item icon={HiArrowSmRight} className='cursor-pointer' onClick={() => setShowSignout(true)}>Sign Out</Sidebar.Item>
                    </Sidebar.ItemGroup>

                </Sidebar.Items>
            </Sidebar>

            <Modal show={showSignout} onClose={() => setShowSignout(false)} popup size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to sign out?</h3>
                        <div className='flex justify-center gap-6'>
                            <Link to={'/'}>
                                <Button color='warning' onClick={handleSignout}>Yes, sign out</Button>
                            </Link>
                            <Button color='gray' onClick={() => setShowSignout(false)}>Cancel</Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

        </div >
    )
}
