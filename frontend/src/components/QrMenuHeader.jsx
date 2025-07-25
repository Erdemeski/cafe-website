import { Avatar, Badge, Button, Dropdown, DropdownHeader, Modal, Navbar, NavbarToggle, TextInput } from 'flowbite-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { FaMoon, FaSun } from 'react-icons/fa'
import { FaEuroSign, FaDollarSign } from 'react-icons/fa6'
import { GrCurrency } from "react-icons/gr"
import { useSelector, useDispatch } from "react-redux"
import { toggleTheme } from '../redux/theme/themeSlice'
import { toggleLanguage } from '../redux/page_Language/languageSlice';
import { selectCurrency } from '../redux/currency/currencySlice';
import en from "../assets/lang_Icons/en.png";
import tr from "../assets/lang_Icons/tr.png";
import { signoutSuccess } from '../redux/user/userSlice';
import { HiOutlineExclamationCircle } from 'react-icons/hi'
import { AiOutlineSearch } from 'react-icons/ai'

export default function QrMenuHeader({ onHeightChange }) {

    const dispatch = useDispatch();
    const path = useLocation().pathname;
    const { theme } = useSelector((state) => state.theme);
    const { language } = useSelector((state) => state.language);
    const [isScrolled, setIsScrolled] = useState(false);
    const { currentUser } = useSelector((state) => state.user);
    const [showSignout, setShowSignout] = useState(false);
    const navigate = useNavigate();
    const { tableNumber } = useParams();
    const headerRef = useRef(null);
    const [buttonRef, setButtonRef] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [searchTerm, setSearchTerm] = useState('');
    const [showSearchbar, setShowSearchbar] = useState(false);

    // İlk render'da header yüksekliğini bildir
    useLayoutEffect(() => {
        function updateHeight() {
            if (headerRef.current && onHeightChange) {
                let headerHeight = headerRef.current.offsetHeight;
                if (showSearchbar) headerHeight += 58; // searchbar yüksekliği
                if (!showSearchbar && buttonRef) headerHeight -= 58;
                onHeightChange(headerHeight);
            }
        }
        updateHeight(); // İlk render ve dependency değişiminde hemen ölç
        window.addEventListener('resize', updateHeight);
        return () => {
            window.removeEventListener('resize', updateHeight);
        };
    }, [showSearchbar, onHeightChange]);

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

    const handleSearch = (e) => {
        e.preventDefault();
        console.log(searchTerm);
    };


    return (
        <div ref={headerRef} className={`sticky top-0 z-[9998] transition-all duration-300 ${isScrolled ? 'backdrop-blur-3xl bg-white/5 dark:bg-[rgb(22,26,29)]/10 shadow-md' : ''}`}>
            <Navbar className={`transition-all duration-300 ${isScrolled ? 'bg-white/60 dark:bg-[rgb(22,26,29)]/70 dark:shadow-2xl' : 'dark:bg-[rgb(22,26,29)]'}`}>
                <Link to={`/qr-order/${tableNumber}`} className='self-center whitespace-nowrap text-sm sm:text-xl font-semibold dark:text-white focus:outline-none focus:ring-0' onClick={() => { setSearchTerm(''); setIsOpen(false); }}>
                    <span className='ml-2 text-2xl font-semibold'>Erdem's <span className='bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-transparent bg-clip-text'>Cafe</span></span>
                </Link>

                <div className='flex gap-1 md:order-2'>

                    <>
                        <form onSubmit={handleSearch}>
                            <TextInput
                                type='text'
                                placeholder='Search...'
                                rightIcon={AiOutlineSearch}
                                className='hidden lg:inline'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>
                        <Button className='w-13 h-11 lg:hidden dark:bg-[rgb(22,26,29)]/50 dark:text-gray-300' color='gray' pill onClick={() => { setShowSearchbar(!showSearchbar); setButtonRef(true); }}>
                            <AiOutlineSearch className='w-4 h-6' />
                        </Button>
                    </>
                    <Button className='w-13 h-11 dark:bg-[rgb(22,26,29)]/50 inline dark:text-gray-300' color='gray' pill onClick={() => dispatch(toggleLanguage())}>
                        {language === 'en' ?
                            <div className='flex justify-center items-center'><img src={en} alt="" className='w-4 h-4' /></div>
                            :
                            <div className='flex justify-center items-center'><img src={tr} alt="" className='w-4 h-4' /></div>}
                    </Button>

                    <Button className='w-13 h-11 dark:bg-[rgb(22,26,29)]/50 inline dark:text-gray-300' color='gray' pill onClick={() => dispatch(toggleTheme())}>
                        {theme === 'light' ? <FaSun className='text-gray-700 dark:text-gray-300' /> : <FaMoon className='text-gray-700 dark:text-gray-300' />}
                    </Button>
                </div >
            </Navbar >

            <div className={`transition-all duration-300 ${isScrolled ? 'backdrop-blur-3xl bg-white/5 dark:bg-[rgb(22,26,29)]/5' : ''}`}>
                <div
                    className={`w-full sticky left-0 top-full z-[9990] transition-all duration-300 overflow-hidden lg:hidden bg-white dark:bg-[rgb(22,26,29)]
                    ${showSearchbar ? 'max-h-20 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}
                    ${isScrolled ? 'bg-white/60 dark:bg-[rgb(22,26,29)]/60 dark:shadow-2xl' : 'dark:bg-[rgb(22,26,29)]'}
                    `}
                    style={{ boxShadow: showSearchbar ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}
                >
                    <form onSubmit={handleSearch} className='flex items-center px-4 py-2'>
                        <TextInput
                            type='text'
                            placeholder='Menüde Ara...'
                            rightIcon={AiOutlineSearch}
                            className='w-full'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus={showSearchbar}
                        />
                    </form>
                </div>
            </div>


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
