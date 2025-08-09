import { Avatar, Badge, Button, Dropdown, DropdownHeader, Modal, Navbar, NavbarToggle } from 'flowbite-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import { FaMoon, FaSun } from 'react-icons/fa'
import { FaEuroSign, FaDollarSign } from 'react-icons/fa6'
import { GrCurrency } from "react-icons/gr"
import { useSelector, useDispatch } from "react-redux"
import { toggleTheme } from '../redux/theme/themeSlice'
import { toggleLanguage } from '../redux/page_Language/languageSlice';
import { selectCurrency } from '../redux/currency/currencySlice';
import en from "../assets/lang_Icons/en.png";
import tr from "../assets/lang_Icons/tr.png";
import { signoutSuccess, sessionExpired } from '../redux/user/userSlice';
import { HiOutlineExclamationCircle } from 'react-icons/hi'

export default function Header() {

    const dispatch = useDispatch();
    const path = useLocation().pathname;
    const { theme } = useSelector((state) => state.theme);
    const { language } = useSelector((state) => state.language);
    const { currency } = useSelector((state) => state.currency);
    const [isScrolled, setIsScrolled] = useState(false);
    const { currentUser, sessionExpiresAt } = useSelector((state) => state.user);
    const [showSignout, setShowSignout] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto signout when session expires (client-side timer)
    useEffect(() => {
        if (!sessionExpiresAt) return;
        const now = Date.now();
        const msLeft = sessionExpiresAt - now;
        if (msLeft <= 0) {
            dispatch(sessionExpired());
            return;
        }
        const timer = setTimeout(() => {
            dispatch(sessionExpired());
        }, msLeft);
        return () => clearTimeout(timer);
    }, [sessionExpiresAt, dispatch]);

    // Minimal activity-based keep-alive: refresh session on user activity
    useEffect(() => {
        if (!currentUser) return;
        let cooldown = false;
        const REFRESH_COOLDOWN_MS = 3000; // prevent spamming

        const refresh = async () => {
            if (cooldown) return;
            cooldown = true;
            try {
                const res = await fetch('/api/auth/refresh', { method: 'POST' });
                if (res.status === 401) {
                    dispatch(sessionExpired());
                    return;
                }
                const data = await res.json();
                if (res.ok && data?.sessionExpiresAt) {
                    // Update only the expiry timestamp in store
                    dispatch({ type: 'user/signInSuccess', payload: { ...currentUser, sessionExpiresAt: data.sessionExpiresAt } });
                }
            } catch (_) {
                // ignore network errors here
            } finally {
                setTimeout(() => { cooldown = false; }, REFRESH_COOLDOWN_MS);
            }
        };

        const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'visibilitychange'];
        const handler = () => {
            if (document.visibilityState === 'hidden') return;
            refresh();
        };
        activityEvents.forEach(evt => window.addEventListener(evt, handler));
        return () => activityEvents.forEach(evt => window.removeEventListener(evt, handler));
    }, [currentUser, dispatch]);

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
        <div className={`sticky top-0 z-[9998] transition-all duration-300 ${isScrolled ? 'backdrop-blur-3xl bg-white/5 dark:bg-[rgb(22,26,29)]/5 shadow-md' : ''} ${path.startsWith('/qr-order') ? 'hidden' : ''}`}>
            <Navbar className={`transition-all duration-300 ${isScrolled ? 'bg-white/70 dark:bg-[rgb(22,26,29)]/70 dark:shadow-2xl' : 'dark:bg-[rgb(22,26,29)]'}`}>
                <Link to="/" className='self-center whitespace-nowrap text-sm sm:text-xl font-semibold dark:text-white focus:outline-none focus:ring-0' onClick={() => { setSearchTerm(''); setIsOpen(false); }}>
                    <span className='ml-2 text-2xl font-semibold'>Erdem's <span className='bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-transparent bg-clip-text'>Cafe</span></span>
                </Link>
                <div className='flex gap-1 md:order-2'>

                    <Button className='w-13 h-11 dark:bg-[rgb(22,26,29)]/70 hidden sm:inline' color='gray' pill onClick={() => dispatch(toggleLanguage())}>
                        {language === 'en' ?
                            <div className='flex justify-center items-center'><img src={en} alt="" className='w-4 h-4' /></div>
                            :
                            <div className='flex justify-center items-center'><img src={tr} alt="" className='w-4 h-4' /></div>}
                    </Button>

                    {/*                     <Dropdown className='hidden sm:inline' label="" dismissOnClick={false} renderTrigger={() => <span>
                        <Button className='w-13 h-11 dark:bg-[rgb(22,26,29)]/70 hidden sm:inline' color='gray' pill>
                            <GrCurrency className='w-4 h-4 text-gray-700 dark:text-gray-300' />
                        </Button>
                    </span>}>
                        <Dropdown.Item className={currency === 'usd' ? 'dark:bg-slate-600 bg-gray-100' : ''} onClick={() => dispatch(selectCurrency('usd'))}>
                            <div className='flex justify-center items-center'>
                                <FaDollarSign className='w-5 h-5 mr-1' />
                                <span className='flex justify-center'>USD</span>
                            </div>
                        </Dropdown.Item>
                        <Dropdown.Item className={currency === 'eur' ? 'dark:bg-slate-600 bg-gray-100' : ''} onClick={() => dispatch(selectCurrency('eur'))}>
                            <div className='flex justify-center items-center'>
                                <FaEuroSign className='w-5 h-5 mr-1' />
                                <span className='flex justify-center'>EUR</span>
                            </div>
                        </Dropdown.Item>
                    </Dropdown>
 */}
                    <Button className='w-13 h-11 dark:bg-[rgb(22,26,29)]/70 hidden sm:inline' color='gray' pill onClick={() => dispatch(toggleTheme())}>
                        {theme === 'light' ? <FaSun className='text-gray-700 dark:text-gray-300' /> : <FaMoon className='text-gray-700 dark:text-gray-300' />}
                    </Button>

                    {currentUser ? (
                        <Dropdown className='z-50' arrowIcon={false} inline label={<Avatar alt='user' img={currentUser.profilePicture} rounded />}>
                            <DropdownHeader>
                                {currentUser.isAdmin ? (
                                    <Badge color='failure' size='xs' className='cursor-default'>Admin User</Badge>
                                ) : (
                                    currentUser.isManager ? (
                                        <Badge color='warning' size='xs' className='cursor-default'>Manager User</Badge>
                                    ) : (
                                        currentUser.isWaiter ? (
                                            <Badge color='success' size='xs' className='cursor-default'>Waiter User</Badge>
                                        ) : (
                                            currentUser.isReception ? (
                                                <Badge color='danger' size='xs' className='cursor-default'>Reception User</Badge>
                                            ) : (
                                                <Badge color='gray' size='xs' className='cursor-default'>Undefined</Badge>
                                            )
                                        )
                                    )
                                )}
                                <div className='flex flex-col gap-1'>
                                    <span className='block text-sm text-gray-500 dark:text-gray-400 mt-2'>Staff No: {currentUser.staffId}</span>
                                    <span className='block text-lg font-medium truncate'>{currentUser.firstName} {currentUser.lastName}</span>
                                </div>
                            </DropdownHeader>
                            <div>
                                <Link to={'/dashboard-director'}>
                                    <Dropdown.Item>Dashboard</Dropdown.Item>
                                </Link>
                            </div>
                            <Dropdown.Item onClick={() => setShowSignout(true)}>Sign Out</Dropdown.Item>
                        </Dropdown>
                    ) : null}


                    <NavbarToggle />
                </div >
                <Navbar.Collapse>
                    <Navbar.Link active={path === "/"} as={'div'}>
                        <Link to='/'>
                            Home
                        </Link>
                    </Navbar.Link>
                    <Navbar.Link active={path === "/public-menu"} as={'div'}>
                        <Link to='/public-menu'>
                            Public Menu
                        </Link>
                    </Navbar.Link>
                    <Navbar.Link active={path === "/about"} as={'div'}>
                        <Link to='/about'>
                            About Us
                        </Link>
                    </Navbar.Link>
                    <div className='flex justify-center sm:hidden'>
                        <Navbar.Link as={'div'}>
                            <div onClick={(e) => e.stopPropagation()}>
                                <Dropdown label="Language" className='rounded-full z-50' inline>
                                    <Button className='w-13 h-11 justify-center items-center mx-1' color='gray' pill onClick={() => dispatch(toggleLanguage())}>
                                        {language === 'en' ?
                                            <div className='flex justify-center items-center'><img src={en} alt="" className='w-4 h-4' /></div>
                                            :
                                            <div className='flex justify-center items-center'><img src={tr} alt="" className='w-4 h-4' /></div>}
                                    </Button>
                                </Dropdown>
                            </div>
                        </Navbar.Link>

                        {/*                         <Navbar.Link as={'div'}>
                            <div onClick={(e) => e.stopPropagation()}>
                                <Dropdown label="Currency" className='z-50' inline>
                                    <Dropdown.Item className={currency === 'usd' ? 'dark:bg-slate-600 bg-gray-100' : ''} onClick={() => dispatch(selectCurrency('usd'))}>
                                        <div className='flex justify-center items-center'>
                                            <FaDollarSign className='w-5 h-5 mr-1' />
                                            <span className='flex justify-center'>USD</span>
                                        </div>
                                    </Dropdown.Item>
                                    <Dropdown.Item className={currency === 'eur' ? 'dark:bg-slate-600 bg-gray-100' : ''} onClick={() => dispatch(selectCurrency('eur'))}>
                                        <div className='flex justify-center items-center'>
                                            <FaEuroSign className='w-5 h-5 mr-1' />
                                            <span className='flex justify-center'>EUR</span>
                                        </div>
                                    </Dropdown.Item>
                                </Dropdown>
                            </div>
                        </Navbar.Link>
 */}
                        <Navbar.Link as={'div'}>
                            <div onClick={(e) => e.stopPropagation()}>
                                <Dropdown label="Theme" className='rounded-full z-50' inline>
                                    <Button className='w-13 h-11 justify-center items-center mx-1' color='gray' pill onClick={() => dispatch(toggleTheme())}>
                                        {theme === 'light' ? <FaSun className='text-gray-700 dark:text-gray-300' /> : <FaMoon className='text-gray-700 dark:text-gray-300' />}
                                    </Button>
                                </Dropdown>
                            </div>
                        </Navbar.Link>
                    </div>
                </Navbar.Collapse>
            </Navbar >

            <Modal show={showSignout} onClose={() => setShowSignout(false)} popup size='md' className='z-[9999]'>
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


        </div>
    )
}
