import React from 'react';
import './style/App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Overview from './Overview';
import Booknow from './Booknow';
import Suites from './Suites' ;
import Standard from './Standard';
import Grandstandard from './Grandstandard' ;
import Cafe from './Cafe' ;
import Clubs from './Clubs' ;
import Register from './Register';
import Profile from './Profile';
import Admin from './Admin';
import Marketing from './Marketing';
import BookingManagement from './BookingManagement';
import ReceptionDashboard from './ReceptionDashboard';


import RevenueDashboard from './RevenueDashboard';
import Expenses from './Expenses';
import Reports from './Reports';
import Revenue from './Revenue';
import Sidebar from './Sidebar';

function App() {
  return (

      <div>      
        <Routes>
          <Route path='/' element={<Overview/>} />
          <Route path='/Login' element={<Login />} />
          <Route path='/Overview' element={<Overview />} />
          <Route path='/Booknow' element={<Booknow />} />
          <Route path='/Suites' element={<Suites />} />
          <Route path='/Standard' element={<Standard />} />
          <Route path='/Grandstandard' element={<Grandstandard />} />
          <Route path='/Cafe' element={<Cafe />} />
          <Route path='/Clubs' element={<Clubs />} />
          <Route path='/Register' element={<Register />} />
          <Route path='/Profile' element={<Profile/>} />
          <Route path='/Admin' element={<Admin/>} />
          <Route path='/Marketing' element={<Marketing/>} />
          <Route path='/ReceptionDashboard' element={<ReceptionDashboard/>} />
          <Route path='/BookingManagement' element={<BookingManagement/>} />
          <Route path='/RevenueDashboard' element={<RevenueDashboard/>} />
          <Route path='/Expenses' element={<Expenses/>} />
          <Route path='/Reports' element={<Reports/>} />
          <Route path='/Revenue' element={<Revenue/>} />
          <Route path='/Sidebar' element={<Sidebar/>} />


          












        </Routes>
      </div>
  );
}

export default App;
