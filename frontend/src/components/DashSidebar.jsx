import React, { useEffect, useState } from 'react'
import { Button, Modal, Sidebar } from 'flowbite-react'
import { HiAnnotation, HiArrowSmRight, HiChartPie, HiDocumentText, HiOutlineUserGroup, HiUser } from 'react-icons/hi'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signoutSuccess } from "../redux/user/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { HiBanknotes } from "react-icons/hi2";
import { MdOutlineCommentBank } from "react-icons/md";
import { IoIosMail } from "react-icons/io";
import { MdOutlineSettings } from "react-icons/md";

export default function DashSidebar() {

    const location = useLocation();
    const [tab, setTab] = useState('')
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
                navigate('/');
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    return (
        <div className='h-full'>
            <Sidebar className='w-full md:w-56 h-full'>
                <Sidebar.Items>
                    <Sidebar.ItemGroup className='flex flex-col gap-1'>
                        {currentUser && currentUser.isAdmin && (
                            <Link to='/dashboard?tab=dashboard'>
                                <Sidebar.Item active={tab === 'dashboard' || !tab} icon={HiChartPie} as='div'>Dashboard</Sidebar.Item>
                            </Link>
                        )}
                        <Link to='/dashboard?tab=profile'>
                            <Sidebar.Item active={tab === 'profile'} icon={HiUser} label={currentUser.isAdmin ? 'Admin' : 'User'} labelColor={currentUser.isAdmin ? 'red' : 'dark'} as='div'>Profile</Sidebar.Item>
                        </Link>
                        {!currentUser.isAdmin && (
                            <Link to='/dashboard?tab=bookings'>
                                <Sidebar.Item active={tab === 'bookings' || !tab} icon={MdOutlineCommentBank} as='div'>Bookings</Sidebar.Item>
                            </Link>
                        )}
                        {currentUser.isAdmin && (
                            <Link to='/dashboard?tab=settings'>
                                <Sidebar.Item active={tab === 'settings'} icon={MdOutlineSettings} as='div'>Settings</Sidebar.Item>
                            </Link>
                        )}

                    </Sidebar.ItemGroup>
                    {currentUser.isAdmin && (
                        <>
                            <Sidebar.ItemGroup className='flex flex-col gap-1'>
                                {currentUser.isAdmin && (
                                    <Link to='/dashboard?tab=reservations'>
                                        <Sidebar.Item active={tab === 'reservations'} icon={HiBanknotes} as='div'>Reservations</Sidebar.Item>
                                    </Link>
                                )}

                            </Sidebar.ItemGroup>
                            <Sidebar.ItemGroup className='flex flex-col gap-1'>
                                {currentUser.isAdmin && (
                                    <Link to='/dashboard?tab=advertisements'>
                                        <Sidebar.Item active={tab === 'advertisements'} icon={HiDocumentText} as='div'>Advertisements</Sidebar.Item>
                                    </Link>
                                )}
                                {currentUser.isAdmin && (
                                    <Link to='/dashboard?tab=users'>
                                        <Sidebar.Item active={tab === 'users'} icon={HiOutlineUserGroup} as='div'>Users</Sidebar.Item>
                                    </Link>
                                )}
                                {currentUser.isAdmin && (
                                    <Link to='/dashboard?tab=comments'>
                                        <Sidebar.Item active={tab === 'comments'} icon={HiAnnotation} as='div'>Comments</Sidebar.Item>
                                    </Link>
                                )}
                                {currentUser.isAdmin && (
                                    <Link to='/dashboard?tab=feedbacks'>
                                        <Sidebar.Item active={tab === 'feedbacks'} icon={IoIosMail} as='div'>Feedbacks</Sidebar.Item>
                                    </Link>
                                )}
                            </Sidebar.ItemGroup>
                        </>
                    )}
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
