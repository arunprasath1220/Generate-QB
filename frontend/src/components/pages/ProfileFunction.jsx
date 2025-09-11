import React from 'react';
import Profile from '../images/profile.png';

const ProfileFunction = ({ isOpen, onClose, onLogout }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-end">
      <div className="bg-white w-[360px] p-8 rounded-2xl shadow-xl relative mr-10 text-center">
        <button
          className="absolute top-4 right-5 text-2xl text-gray-500 hover:text-black"
          onClick={onClose}
        >
          ×
        </button>
        <img
          src={Profile}
          alt="Profile"
          className="w-24 h-24 mx-auto rounded-full mb-6 border-2 border-gray-300"
        />
        <div className="text-left text-base font-medium text-gray-800 space-y-3">
          <p><span className="font-semibold">Name:</span> Daniel M</p>
          <p><span className="font-semibold">Faculty ID:</span> 12345</p>
          <p><span className="font-semibold">Subject:</span> F.O.C</p>
          <p><span className="font-semibold">Department:</span> C.S.E</p>
          <p><span className="font-semibold">Email ID:</span> danielm7708@bitsathy.ac.in</p>
          <p><span className="font-semibold">Phone No:</span> 0123456789</p>
        </div>
        <button
          className="mt-8 w-full bg-blue-500 text-white font-semibold py-3 rounded-md hover:bg-blue-600 transition"
          onClick={onLogout}
        >
          LOGOUT
        </button>
      </div>
    </div>
  );
};

export default ProfileFunction;
