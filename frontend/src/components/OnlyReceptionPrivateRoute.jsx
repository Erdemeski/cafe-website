import React from 'react'
import { useSelector } from 'react-redux'
import { Outlet, Navigate } from 'react-router-dom'


export default function OnlyReceptionPrivateRoute() {

    const { currentUser } = useSelector((state) => state.user)

    return currentUser && currentUser.isReception ? (<Outlet />) : (<Navigate to='/dashboard-director' />);
}
