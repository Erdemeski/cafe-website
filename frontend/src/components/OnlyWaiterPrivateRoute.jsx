import React from 'react'
import { useSelector } from 'react-redux'
import { Outlet, Navigate } from 'react-router-dom'


export default function OnlyWaiterPrivateRoute() {

    const { currentUser } = useSelector((state) => state.user)

    return currentUser && currentUser.isWaiter ? (<Outlet />) : (<Navigate to='/dashboard-director' />);
}
