"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/app/store/store";
import {
  handleUpload,
  setSelectedFile,
  selectImageUpload,
} from "@/app/store/imageUploadSlice";

export function Upload() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { status, uploadUrl, signature, jobId } = useSelector(
    (state: RootState) => state.imageUpload
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    type: string;
    size: number;
    url: string;
  } | null>(null);

  const handleFileSelect = async (file: File) => {
    if (file) {
      dispatch(setSelectedFile(file));
      setFileDetails({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
      });
      await dispatch(handleUpload(file));
    }
  };

  useEffect(() => {
    if (status === "succeeded" && uploadUrl && signature && jobId) {
      router.push("/convert");
    }

    return () => {
      if (fileDetails?.url) {
        URL.revokeObjectURL(fileDetails.url);
      }
    };
  }, [status, uploadUrl, signature, jobId, router]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center bg-irBlue-100 dark:bg-darkPrimary-600 p-3">
        <div
          className="w-full h-full py-10 px-4 bg-blue-400 dark:bg-darkPrimary-100 flex items-center justify-center border-4 border-irBlue-600 dark:border-darkPrimary-400 border-dashed"
          id="image-uploader-container"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center text-sm md:text-base">
            <svg
              width="55"
              height="55"
              viewBox="0 0 56 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="dark:fill-white fill-gray"
            >
              <path d="M44.9151 0.820312H11.0855C5.42482 0.820312 0.819824 5.42531 0.819824 11.0859V44.9156C0.819824 50.5762 5.42482 55.1803 11.0855 55.1803H44.9151C50.5748 55.1803 55.1798 50.5753 55.1798 44.9156V11.0859C55.1798 5.42531 50.5748 0.820312 44.9151 0.820312ZM11.0855 2.69531H44.9151C49.5417 2.69531 53.3048 6.45938 53.3048 11.0859V42.6525L46.3476 35.6953C45.4645 34.8113 44.2851 34.3237 43.027 34.3237C41.7698 34.3237 40.5905 34.8113 39.7073 35.6944L31.7939 43.5966L15.9998 27.8025C15.1167 26.9184 13.942 26.4319 12.6933 26.4319C11.4445 26.4319 10.2708 26.9194 9.3867 27.8025L2.69576 34.4934V11.0859C2.69482 6.45844 6.45795 2.69531 11.0855 2.69531ZM2.69482 44.9156V37.1447L10.7114 29.1281C11.7717 28.0678 13.6139 28.0688 14.6742 29.1281L38.8523 53.3053H11.0855C6.45795 53.3053 2.69482 49.5422 2.69482 44.9156ZM44.9151 53.3053H41.5026L33.1205 44.9231L41.033 37.0209C42.0942 35.9606 43.9626 35.9616 45.022 37.0209L53.2861 45.285C53.0911 49.7391 49.417 53.3053 44.9151 53.3053Z"></path>
              <path d="M28.0137 20.7667C31.4177 20.7667 34.1861 17.9973 34.1861 14.5942C34.1861 11.1761 31.4177 8.39453 28.0137 8.39453C24.5955 8.39453 21.814 11.1752 21.814 14.5942C21.813 17.9973 24.5946 20.7667 28.0137 20.7667ZM28.0137 10.2686C30.3827 10.2686 32.3111 12.2083 32.3111 14.5933C32.3111 16.9633 30.3827 18.8908 28.0137 18.8908C25.6287 18.8908 23.689 16.9623 23.689 14.5933C23.688 12.2092 25.6287 10.2686 28.0137 10.2686Z"></path>
            </svg>
            <div className="relative cursor-pointer flex bg-slate-50 dark:bg-darkSurface-200 rounded-md mt-8 select-none">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) =>
                  e.target.files?.[0] && handleFileSelect(e.target.files[0])
                }
                className="hidden"
                accept="image/*"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center py-5 px-6 gap-2 border-r-gray-200 dark:border-r-darkSurface-100 border-r hover:bg-irGray-200 dark:hover:bg-darkSurface-300 rounded-md"
                data-testid="device-upload-direct"
              >
                <svg
                  width="15.8"
                  height="17.9"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="fill-black dark:fill-gray undefined"
                >
                  <path d="M9.62797 16.8053H3.14748C2.29062 16.8053 1.5933 16.1082 1.5933 15.2514V2.64748C1.5933 1.7904 2.29062 1.09308 3.14748 1.09308H13.6512C14.5076 1.09308 15.2047 1.7904 15.2047 2.64748V8.60266C15.2047 8.90398 15.45 9.14908 15.7514 9.14908C16.0527 9.14908 16.298 8.90398 16.298 8.60266V2.64748C16.298 1.18775 15.1105 0 13.6512 0H3.14748C1.68752 0 0.5 1.18775 0.5 2.64748V15.2514C0.5 16.7111 1.68752 17.8988 3.14748 17.8988H9.62797C9.9293 17.8988 10.1746 17.6535 10.1746 17.352C10.1746 17.0506 9.9293 16.8053 9.62797 16.8053Z"></path>
                  <path d="M15.2266 9.45312C12.3191 9.45312 9.95361 11.8188 9.95361 14.7261C9.95339 17.6338 12.3191 19.9995 15.2266 19.9995C18.1341 19.9995 20.4998 17.6338 20.4998 14.7263C20.4998 11.8188 18.1341 9.45312 15.2266 9.45312ZM15.2266 18.9062C12.922 18.9062 11.0467 17.0311 11.0467 14.7261C11.0467 12.421 12.9218 10.546 15.2266 10.546C17.5316 10.546 19.4067 12.421 19.4067 14.7261C19.4067 17.0311 17.5316 18.9062 15.2266 18.9062Z"></path>
                  <path d="M17.5272 14.1807H15.7733V12.4265C15.7733 12.1252 15.5279 11.8799 15.2264 11.8799C14.9248 11.8799 14.6795 12.1252 14.6795 12.4265V14.1807H12.9256C12.6245 14.1807 12.3789 14.426 12.3789 14.7271C12.3789 15.0287 12.6242 15.274 12.9256 15.274H14.6795V17.0282C14.6795 17.3295 14.9248 17.5748 15.2264 17.5748C15.5279 17.5748 15.7733 17.3295 15.7733 17.0282V15.2738H17.5272C17.8283 15.2738 18.0739 15.0285 18.0739 14.7269C18.0739 14.4254 17.8285 14.1807 17.5272 14.1807Z"></path>
                  <path d="M12.2545 4.40234H4.5447C4.24337 4.40234 3.99805 4.64767 3.99805 4.94922C3.99805 5.25032 4.24337 5.49565 4.5447 5.49565H12.2538C12.5551 5.49565 12.8007 5.25032 12.8007 4.94922C12.8009 4.64767 12.5556 4.40234 12.2545 4.40234Z"></path>
                  <path d="M12.8009 8.4236C12.8009 8.12228 12.5556 7.87695 12.2545 7.87695H4.5447C4.24337 7.87695 3.99805 8.12228 3.99805 8.4236C3.99805 8.72471 4.24337 8.97003 4.5447 8.97003H12.2538C12.5556 8.97003 12.8009 8.72493 12.8009 8.4236Z"></path>
                  <path d="M4.5447 11.3545C4.24337 11.3545 3.99805 11.5998 3.99805 11.9014C3.99805 12.2025 4.24337 12.4478 4.5447 12.4478H9.10302C9.40434 12.4478 9.64967 12.2025 9.64967 11.9014C9.64967 11.6 9.40434 11.3545 9.10302 11.3545H4.5447Z"></path>
                </svg>
                <div className="font-semibold whitespace-nowrap leading-4-5 text-black dark:text-black">
                  <span>
                    <span className="false">Select Image</span>
                  </span>
                </div>
              </button>
              {status === "loading" && <p>Uploading...</p>}
              {status === "failed" && <p>Upload failed. Please try again.</p>}

              <div className="relative inline-block">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="rounded-md overflow-hidden flex items-center justify-center px-5 hover:bg-gray-100 dark:hover:bg-gray-200 h-full"
                >
                  <svg
                    width="16"
                    height="8"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1L4.97647 5L9 1"
                      className="stroke-black dark:stroke-black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-darkSurface-200 ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-800 dark:hover:bg-darkSurface-300"
                        onClick={() => {
                          console.log("URL upload clicked");
                          setIsDropdownOpen(false);
                        }}
                      >
                        Upload from URL
                      </button>

                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-800 dark:hover:bg-darkSurface-300"
                        onClick={() => {
                          console.log("Paste from clipboard clicked");
                          setIsDropdownOpen(false);
                        }}
                      >
                        Paste from Clipboard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-black mt-8 font-semibold">
              <span>
                <span className="false">or, drag and drop an image here</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Upload;
