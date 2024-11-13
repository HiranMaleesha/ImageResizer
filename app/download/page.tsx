"use client";
import React from "react";
import Header from "../../components/layout/header";
import "../globals.css";
import { useSearchParams } from "next/navigation";
import Footer from "../../components/layout/footer";

function download() {
  const searchParams = useSearchParams();
  const fileUrl = searchParams.get("fileUrl");

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = "converted-image";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div>
      <Header />

      <div className="flex justify-center mt-7">
        <svg
          width="20"
          height="40"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.55469 11.0005L9.88802 14.3339L15.4436 8.77832"
            stroke="#27AE60"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
          <path
            d="M1 11C1 9.68678 1.25866 8.38642 1.7612 7.17317C2.26375 5.95991 3.00035 4.85752 3.92893 3.92893C4.85752 3.00035 5.95991 2.26375 7.17317 1.7612C8.38642 1.25866 9.68678 1 11 1C12.3132 1 13.6136 1.25866 14.8268 1.7612C16.0401 2.26375 17.1425 3.00035 18.0711 3.92893C18.9997 4.85752 19.7363 5.95991 20.2388 7.17317C20.7413 8.38642 21 9.68678 21 11C21 13.6522 19.9464 16.1957 18.0711 18.0711C16.1957 19.9464 13.6522 21 11 21C8.34784 21 5.8043 19.9464 3.92893 18.0711C2.05357 16.1957 1 13.6522 1 11V11Z"
            stroke="#27AE60"
            strokeWidth="2"
            strokeLinecap="round"
          ></path>
        </svg>
        <h1 className="font-semibold text-3xl ml-2">Save Your Image</h1>
      </div>
      <div className="flex justify-center mt-1 text-2xl">
        Click the download button to save your image
      </div>
      <div className="flex justify-center mt-28">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#4284F3] text-white rounded-md hover:bg-[#3367D6] transition-colors duration-200"
          disabled={!fileUrl}
        >
          <div className="w-8 h-8" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            width="25"
            height="25"
            className="fill-irGray-300 dark:fill-white"
          >
            <path d="M480.6 341.4c-11.3 0-20.4 9.1-20.4 20.4v98.4H51.8v-98.4c0-11.3-9.1-20.4-20.4-20.4-11.3 0-20.4 9.1-20.4 20.4v118.8c0 11.3 9.1 20.4 20.4 20.4h449.2c11.3 0 20.4-9.1 20.4-20.4V361.8c0-11.3-9.1-20.4-20.4-20.4z"></path>
            <path d="M241 365.6c11.5 11.6 25.6 5.2 29.9 0l117.3-126.2c7.7-8.3 7.2-21.2-1.1-28.9-8.3-7.7-21.2-7.2-28.8 1.1l-81.9 88.1V34.5c0-11.3-9.1-20.4-20.4-20.4-11.3 0-20.4 9.1-20.4 20.4v265.3l-81.9-88.1c-7.7-8.3-20.6-8.7-28.9-1.1-8.3 7.7-8.7 20.6-1.1 28.9L241 365.6z"></path>
          </svg>
          <span className="text-base font-medium">
            {fileUrl ? "Download Image" : "Loading..."}
          </span>
        </button>
      </div>
      <Footer />
    </div>
  );
}

export default download;
