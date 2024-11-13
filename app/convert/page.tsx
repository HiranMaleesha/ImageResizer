"use client";
import { useState, useEffect, useRef } from "react";
import React from "react";
import "../globals.css";
import Header from "../../components/layout/header";
import io, { Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import {
  handleUpload,
  setWidth,
  setHeight,
} from "@/app/store/imageUploadSlice";
import { useSelector, useDispatch } from "react-redux";
import { selectImageUpload } from "@/app/store/imageUploadSlice";

export var selectedFile: { file: File | undefined } = { file: undefined };

function Page() {
  const [selected, setSelected] = useState("dimensions");
  const [percentage, setPercentage] = useState(100);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [FinalUrl, setFinalUrl] = useState<string | null>(null);
  const router = useRouter();
  const [unit, setUnit] = useState("Pixels");
  const dispatch = useDispatch();
  const { uploadUrl, signature, selectedFile, jobId, width, height } =
    useSelector(selectImageUpload);

  console.log(selectedFile);

  useEffect(() => {
    if (selectedFile) {
      const img = new Image();
      img.onload = () => {
        dispatch(setWidth(img.naturalWidth));
        dispatch(setHeight(img.naturalHeight));
      };
      img.src = URL.createObjectURL(selectedFile);
    }
  }, [selectedFile, dispatch]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number(e.target.value);
    dispatch(setWidth(newWidth));
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = Number(e.target.value);
    dispatch(setHeight(newHeight));
  };

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const tokenResponse = await fetch(
          "https://dev-api.freeconvert.com/v1/account/guest"
        );
        const fetchedToken = await tokenResponse.text();
        tokenRef.current = fetchedToken;

        socketRef.current = io("https://dev-notification.freeconvert.com/", {
          auth: {
            token: `Bearer ${fetchedToken}`,
          },
          transports: ["websocket"],
        });

        socketRef.current?.on("connect", () => {
          console.log("Connected to the server");
          if (jobId) {
            console.log(jobId);
            socketRef.current?.emit("subscribe", `job.${jobId}`);
          }
        });

        socketRef.current.on("job_failed", (data: any) => {
          handleJobFailed(data.Job);
        });

        socketRef.current.on("jov_start", (data: any) => {
          console.log("job started", data);
        });

        socketRef.current.on("job_completed", (data: any) => {
          handleJobComplete(data.job);
        });
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    };
    initializeSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [jobId]);

  const handleJobFailed = (job: any) => {
    console.log("Job failed:", job);
  };

  const handleJobComplete = (job: any) => {
    console.log("job completed", job);
    fetchJobDetails(job.id);

    socketRef.current?.on("disconnect", () => {
      console.log("Disconnected from the server");
    });
  };

  const uploadFileToJob = async (uploadUrl: string, signature: string) => {
    if (!uploadUrl || !signature || !selectedFile) return;

    console.log(selectedFile);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("signature", signature);

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const jsonResponse = await response.json();
      if (response.ok) {
        console.log("File uploaded successfully:", jsonResponse);
        alert("File uploaded successfully");
      } else {
        console.error("File upload failed:", response.statusText);
        alert("File upload failed");
      }
    } catch (error) {
      console.error("Error during file upload:", error);
      alert("An error occurred during file upload");
    }
  };

  const fetchJobDetails = async (jobId: string) => {
    if (!tokenRef.current) return;

    try {
      const response = await fetch(
        `https://dev-api.freeconvert.com/v1/process/jobs/${jobId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );

      const jobDetails = await response.json();
      if (response.ok) {
        console.log("job details", jobDetails);

        const ResultURL = jobDetails.tasks[2];
        if (ResultURL && ResultURL.result && ResultURL.result.url) {
          setFinalUrl(ResultURL.result.url);
          console.log("ResultURL.result:", ResultURL?.result);
          router.push(
            `/download?fileUrl=${encodeURIComponent(ResultURL.result.url)}`
          );
        }
      } else {
        console.error("Failed to fetch job details:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
    }
  };

  return (
    <div>
      <Header />
      <div className="flex">
        <div className="w-80 max-h-full bg-gray-100 p-4 h-screen">
          <h2 className="pl-5 font-semibold text-lg mb-4">Resize Image</h2>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setSelected("dimensions")}
              className={`px-4 py-1 text-sm rounded-md transition-colors ${
                selected === "dimensions"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              By Dimensions
            </button>
            <button
              onClick={() => setSelected("percentage")}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                selected === "percentage"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              As Percentage
            </button>
          </div>

          {selected === "dimensions" ? (
            <div className="flex flex-col space-y-4">
              <div className="pt-5 flex flex-row gap-20">
                <h1>Width</h1>
                <h1>Height</h1>
              </div>
              <div className="flex flex-row gap-5">
                <input
                  id="width"
                  name="width"
                  value={width?.toString() || ""}
                  onChange={handleWidthChange}
                  className="w-full px-2 py-1 border border-gray-300 rounded-xl"
                />
                <input
                  id="height"
                  name="height"
                  value={height?.toString() || ""}
                  onChange={handleHeightChange}
                  className="w-full px-2 py-1 border border-gray-300 rounded-xl"
                />
              </div>
              <div className="mt-4">
                <p>Unit</p>
              </div>
              <select className="w-full px-2 py-1 border border-gray-300 rounded-xl">
                <option>Pixels</option>
                <option>Inches</option>
                <option>Centimeter</option>
              </select>
              <div className="mt-4">
                <p>DPI</p>
              </div>
              <select className="w-full px-2 py-1 border border-gray-300 rounded-xl">
                <option>300</option>
                <option>150</option>
              </select>
              <p className="mt-4 text-gray-400 text-sm">
                DPI (dots per inch) is for printing. Choose 300 if unsure.
              </p>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              <div>
                <h3 className="font-medium">As Percentage</h3>
                <label className="block text-sm font-semibold mt-2">
                  Resize Percentage
                </label>
                <input
                  type="number"
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                  placeholder="Enter percentage (e.g., 100 for original size)"
                />
              </div>
              <div>
                <h3 className="font-medium">Save Image As</h3>
                <select className="w-full px-2 py-1 border border-gray-300 rounded">
                  <option>JPG</option>
                  <option>PNG</option>
                  <option>GIF</option>
                </select>
              </div>
            </div>
          )}

          <h1 className="mt-8 font-semibold">Export Settings</h1>
          <p className="mt-5">Target file size(KB)</p>
          <input
            type="number"
            className="mt-2 w-full px-2 py-1 border border-gray-300 rounded-xl"
          ></input>
          <p className="mt-4 text-gray-400 text-sm">
            We will compress the image to this size
          </p>
          <p className="mt-5">Save Image As (KB)</p>
          <select className="mt-2 w-full px-2 py-1 border border-gray-300 rounded-xl">
            <option>JPG</option>
            <option>PNG</option>
            <option>GIF</option>
          </select>
          <div className="mt-8">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
              onClick={() => {
                if (uploadUrl && signature) {
                  uploadFileToJob(uploadUrl, signature)
                    .then(() => console.log("Upload successful"))
                    .catch((error) => console.error("Upload failed:", error));
                } else {
                  console.error("Upload URL or signature is missing");
                }
              }}
            >
              <span className="text-lg max-w-full">Resize Image</span>
              <svg width="100" height="40" viewBox="0 0 70 12" fill="white">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12.0896 0.410762C11.7642 0.0853287 11.2365 0.0853287 10.9111 0.410762C10.5857 0.736204 10.5857 1.26384 10.9111 1.58928L14.4885 5.16669H1.50033C1.04009 5.16669 0.666992 5.53977 0.666992 6.00002C0.666992 6.46027 1.04009 6.83335 1.50033 6.83335H14.4885L10.9111 10.4108C10.5857 10.7362 10.5857 11.2639 10.9111 11.5893C11.2365 11.9147 11.7642 11.9147 12.0896 11.5893L17.0896 6.58927C17.415 6.26385 17.415 5.73619 17.0896 5.41077L12.0896 0.410762Z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="relative h-screen">
          <div
            className="flex place-items-baseline w-full py-2 px-1 gap-3"
            data-testid="desktop-edit-types-container"
          >
            <div
              data-testid="desktop-set-edit-type-resize"
              className="ml-4 cursor-pointer flex items-center gap-2 py-2 px-4 rounded-md bg-slate-200 dark:bg-darkSurface-200 dark:hover:bg-darkSurface-200 hover:bg-slate-200 dark:hover:bg-darkSurface-200 whitespace-nowrap focus:outline focus:outline-irBlue-400 dark:focus:outline-none"
            >
              <div>
                <svg
                  width="20"
                  height="18"
                  viewBox="0 0 20 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="fill-black dark:fill-black"
                >
                  <path d="M20 4.0455V0.82389C19.9546 0.565467 19.7098 0.391436 19.4509 0.43352H16.2324C16.127 0.416423 16.02 0.453466 15.9479 0.532153C15.8758 0.61062 15.8477 0.720437 15.8738 0.82389V2.02042H4.13017V0.82389C4.12031 0.703558 4.06025 0.592866 3.96513 0.518563C3.86978 0.444478 3.74769 0.413572 3.62867 0.43352H0.407067C0.298132 0.416862 0.187659 0.45215 0.108536 0.528646C0.0294067 0.605362 -0.00938885 0.714517 0.00398261 0.82389V4.0455C-0.0122371 4.16737 0.0215172 4.29055 0.097358 4.38743C0.173199 4.4841 0.28476 4.54634 0.407067 4.55971H1.27349V13.4467H0.407067C0.294844 13.4362 0.184152 13.4772 0.105685 13.5581C0.0274374 13.6389 -0.0100454 13.7509 0.00398261 13.8625V17.0841C-0.0122371 17.2034 0.0221752 17.3239 0.0986714 17.4166C0.175169 17.5093 0.286954 17.5661 0.407067 17.5729H3.62867C3.89871 17.5681 4.11834 17.3539 4.13017 17.0841V15.986H15.8738V17.0841C15.8738 17.3476 15.969 17.5729 16.2324 17.5729H19.4509C19.7308 17.5718 19.9662 17.3623 20 17.0841V13.8625C19.959 13.5986 19.7162 13.4145 19.4509 13.4467H18.2956L18.2035 4.55972H19.4509C19.7356 4.54722 19.9688 4.32891 20 4.0455L20 4.0455ZM0.956195 3.60756V1.38564H3.17811V3.60756H0.956195ZM3.17811 16.621H0.956195V14.3991H3.17811V16.621ZM15.874 13.8628V15.0341H4.13033V13.8628C4.12156 13.74 4.06304 13.6263 3.96835 13.5478C3.87366 13.4694 3.75092 13.433 3.62883 13.447H2.22581V4.55999H3.62883C3.90369 4.54377 4.1209 4.32086 4.13033 4.04578V2.97309H15.874V4.046C15.874 4.30946 15.9691 4.56022 16.2326 4.56022H17.2513L17.3434 13.4472H16.2325V13.447C16.1243 13.438 16.0184 13.4814 15.9474 13.5636C15.8766 13.646 15.8492 13.7571 15.874 13.8628H15.874ZM19.0478 14.3991V16.6211H16.8261V14.3991H17.4608V14.3422L17.8291 14.3991H19.0478ZM19.0478 3.60771L18.0956 3.60793V3.56343L17.718 3.60793H16.8261V1.38601H19.048V3.60793L19.0478 3.60771Z"></path>
                </svg>
              </div>
              <div>Resize</div>
            </div>
            <div
              data-testid="desktop-set-edit-type-crop"
              className="cursor-pointer flex items-center gap-2 py-2 px-4 rounded-md false hover:bg-slate-200 dark:hover:bg-darkSurface-200 whitespace-nowrap focus:outline focus:outline-irBlue-400 dark:focus:outline-none"
            >
              <div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="fill-black dark:fill-black"
                >
                  <path d="M20 16.0444C20 16.4 19.7111 16.6667 19.3778 16.6667H16.6667H15.4222H6.46667C4.73333 16.6667 3.33333 15.2667 3.33333 13.5333V4.57778H0.622222C0.266667 4.57778 0 4.28889 0 3.95556C0 3.62222 0.288889 3.33333 0.622222 3.33333H3.33333V0.622222C3.33333 0.288889 3.62222 0 3.95556 0C4.28889 0 4.57778 0.288889 4.57778 0.622222V3.33333V4.57778V13.5333C4.57778 14.5556 5.42222 15.4 6.44444 15.4H15.4V6.46667C15.4 5.42222 14.5556 4.6 13.5333 4.6H5.82222V3.33333H13.5333C15.2667 3.33333 16.6667 4.73333 16.6667 6.46667V15.4222H19.3778C19.7111 15.4222 20 15.6889 20 16.0444ZM15.4222 19.3778C15.4222 19.7333 15.7111 20 16.0444 20C16.3778 20 16.6667 19.7111 16.6667 19.3778V17.9111H15.4222V19.3778Z"></path>
                </svg>
              </div>
              <div>Crop</div>
            </div>
            <div
              data-testid="desktop-set-edit-type-flip"
              className="cursor-pointer flex items-center gap-2 py-2 px-4 rounded-md false hover:bg-slate-200 dark:hover:bg-darkSurface-200 whitespace-nowrap focus:outline focus:outline-irBlue-400 dark:focus:outline-none"
            >
              <div>
                <svg
                  width="20"
                  height="21"
                  viewBox="0 0 20 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="fill-black dark:fill-black"
                >
                  <path d="M15.9629 16.8517C15.8393 16.7279 15.6738 16.6549 15.4991 16.6472C15.3244 16.6394 15.1531 16.6974 15.019 16.8097L14.9701 16.8587C14.8375 16.9705 14.7513 17.1275 14.728 17.2994C14.7047 17.4712 14.7462 17.6456 14.8442 17.7886C14.8994 17.8682 14.9706 17.9354 15.0531 17.9861C15.1357 18.0367 15.2279 18.0697 15.3239 18.0828C15.4199 18.096 15.5175 18.089 15.6107 18.0625C15.7038 18.0359 15.7904 17.9902 15.865 17.9284L15.9209 17.8864C15.9958 17.8239 16.0567 17.7464 16.0998 17.6589C16.1428 17.5714 16.1671 17.4758 16.1711 17.3784C16.175 17.2809 16.1585 17.1837 16.1227 17.093C16.0868 17.0023 16.0324 16.9201 15.9629 16.8517Z"></path>
                  <path d="M15.0123 5.0569C15.1464 5.16923 15.3177 5.22724 15.4924 5.21947C15.6671 5.21171 15.8326 5.13873 15.9562 5.01495C16.0253 4.94607 16.0792 4.86349 16.1145 4.77252C16.1497 4.68155 16.1656 4.5842 16.161 4.48674C16.1564 4.38928 16.1314 4.29386 16.0877 4.20662C16.044 4.11938 15.9825 4.04226 15.9072 3.98021L15.8583 3.93826C15.7837 3.87644 15.6971 3.83078 15.604 3.80419C15.5108 3.77761 15.4132 3.77067 15.3172 3.78381C15.2212 3.79696 15.129 3.82991 15.0464 3.88057C14.9639 3.93122 14.8927 3.99849 14.8375 4.07809C14.7374 4.22166 14.6948 4.39755 14.7181 4.57101C14.7414 4.74447 14.829 4.90288 14.9634 5.01495L15.0123 5.0569Z"></path>
                  <path d="M13.5796 18.5228C13.5061 18.3653 13.3766 18.2408 13.2163 18.1735C13.0561 18.1063 12.8765 18.1012 12.7126 18.1592H12.6497C12.4844 18.2182 12.3473 18.3373 12.2657 18.4927C12.1841 18.6481 12.1639 18.8286 12.2092 18.9982C12.2344 19.092 12.2788 19.1795 12.3396 19.2551C12.4004 19.3308 12.4763 19.393 12.5624 19.4377C12.6486 19.4824 12.7431 19.5087 12.84 19.5149C12.9369 19.5211 13.034 19.507 13.1251 19.4736H13.1881C13.2787 19.4401 13.3614 19.3882 13.431 19.3212C13.5005 19.2541 13.5554 19.1734 13.5922 19.084C13.629 18.9947 13.6469 18.8987 13.6447 18.8021C13.6425 18.7055 13.6204 18.6104 13.5796 18.5228Z"></path>
                  <path d="M12.6363 3.70804H12.6992C12.864 3.76805 13.0452 3.76399 13.2071 3.69665C13.369 3.62931 13.4996 3.50362 13.5732 3.34449C13.6138 3.25645 13.6356 3.16092 13.6374 3.06398C13.6391 2.96704 13.6206 2.87081 13.5831 2.78139C13.5456 2.69197 13.49 2.61132 13.4197 2.54457C13.3493 2.47782 13.2659 2.42642 13.1747 2.39365H13.1117C13.0201 2.36034 12.9226 2.34655 12.8253 2.35318C12.7281 2.35981 12.6333 2.3867 12.547 2.43212C12.4608 2.47755 12.385 2.54051 12.3245 2.61696C12.264 2.69342 12.2202 2.78167 12.1959 2.87606C12.1525 3.04468 12.1736 3.22342 12.2551 3.37729C12.3365 3.53117 12.4725 3.64911 12.6363 3.70804Z"></path>
                  <path d="M17.6338 14.4744C17.4765 14.4019 17.2979 14.3903 17.1325 14.442C16.9672 14.4937 16.8269 14.6049 16.7389 14.7541L16.7039 14.817C16.6175 14.9668 16.5896 15.1434 16.6258 15.3125C16.662 15.4817 16.7595 15.6315 16.8997 15.7329C16.9789 15.79 17.0693 15.8298 17.1648 15.8499C17.2604 15.87 17.3591 15.8698 17.4547 15.8494C17.5502 15.829 17.6403 15.7888 17.7194 15.7314C17.7984 15.674 17.8645 15.6006 17.9135 15.5161L17.9484 15.4532C17.996 15.3691 18.0257 15.2761 18.0355 15.18C18.0453 15.0839 18.0352 14.9868 18.0056 14.8949C17.976 14.8029 17.9277 14.718 17.8637 14.6457C17.7998 14.5733 17.7215 14.515 17.6338 14.4744Z"></path>
                  <path d="M18.1303 13.097C18.2241 13.1228 18.3223 13.1287 18.4185 13.1144C18.5148 13.1001 18.607 13.0659 18.6893 13.0139C18.7715 12.9619 18.842 12.8933 18.8963 12.8125C18.9505 12.7317 18.9873 12.6405 19.0042 12.5446V12.4817C19.0211 12.3861 19.0178 12.288 18.9947 12.1937C18.9716 12.0994 18.929 12.011 18.8698 11.9341C18.8107 11.8571 18.7361 11.7933 18.6509 11.7468C18.5657 11.7002 18.4717 11.6719 18.375 11.6637C18.2013 11.6488 18.0282 11.6993 17.8898 11.8054C17.7514 11.9114 17.6576 12.0654 17.6269 12.237V12.3069C17.5982 12.4776 17.6337 12.6528 17.7267 12.7987C17.8197 12.9446 17.9635 13.0509 18.1303 13.097Z"></path>
                  <path d="M16.732 7.11213C16.8201 7.26304 16.9616 7.37546 17.1286 7.42722C17.2955 7.47898 17.4758 7.46634 17.6339 7.39179C17.7219 7.35063 17.8004 7.29157 17.8643 7.21838C17.9282 7.1452 17.9762 7.05949 18.0051 6.96674C18.0341 6.87398 18.0434 6.77621 18.0324 6.67966C18.0214 6.58311 17.9905 6.4899 17.9415 6.40599L17.9065 6.35006C17.8575 6.26657 17.7917 6.19417 17.7133 6.13745C17.6348 6.08073 17.5454 6.04092 17.4508 6.02054C17.3561 6.00017 17.2583 5.99967 17.1634 6.01908C17.0686 6.0385 16.9788 6.0774 16.8998 6.13332C16.7585 6.23369 16.6595 6.38298 16.622 6.55221C16.5845 6.72145 16.6113 6.89857 16.697 7.04921L16.732 7.11213Z"></path>
                  <path d="M17.6281 9.55938V9.6293C17.6587 9.79964 17.7515 9.95256 17.8884 10.0585C18.0253 10.1644 18.1966 10.2157 18.3692 10.2026C18.4665 10.1953 18.5612 10.1677 18.6473 10.1215C18.7333 10.0754 18.8087 10.0117 18.8686 9.93465C18.9286 9.8576 18.9717 9.76884 18.9952 9.67411C19.0188 9.57937 19.0222 9.48075 19.0054 9.3846V9.31468C18.9884 9.21886 18.9517 9.12762 18.8974 9.04682C18.8432 8.96602 18.7727 8.89743 18.6904 8.84544C18.6082 8.79345 18.516 8.75921 18.4197 8.7449C18.3234 8.7306 18.2253 8.73654 18.1314 8.76235C17.9632 8.80848 17.8183 8.91581 17.7252 9.06327C17.6321 9.21073 17.5974 9.38768 17.6281 9.55938Z"></path>
                  <path d="M9.30057 19.9979C9.39863 20.0088 9.49788 19.9987 9.59179 19.9685C9.68571 19.9382 9.77215 19.8885 9.84546 19.8224C9.91876 19.7564 9.97725 19.6756 10.0171 19.5853C10.0569 19.4951 10.0772 19.3974 10.0766 19.2987C10.0775 19.1248 10.0135 18.9568 9.89716 18.8275C9.78081 18.6983 9.62045 18.617 9.44739 18.5996C7.56954 18.4387 5.81616 17.5938 4.52016 16.2253C3.22417 14.8569 2.4758 13.0602 2.41714 11.1764C2.35849 9.29257 2.99364 7.4528 4.20199 6.00639C5.41035 4.55998 7.10777 3.60764 8.97197 3.33021L8.07007 4.57469C7.96321 4.72511 7.92015 4.91168 7.95027 5.09372C7.98039 5.27577 8.08126 5.43852 8.23088 5.54651C8.3813 5.65337 8.56787 5.69643 8.74991 5.66631C8.93195 5.63618 9.09471 5.53532 9.20269 5.3857L10.601 3.45605C10.7141 3.29655 10.794 3.11598 10.836 2.92504C10.8781 2.73409 10.8813 2.53665 10.8457 2.34441C10.8071 2.15292 10.731 1.97095 10.6218 1.80897C10.5126 1.64699 10.3725 1.50819 10.2095 1.40056L8.20291 0.114124C8.04622 0.0121396 7.85544 -0.0234247 7.67254 0.0152544C7.48963 0.0539336 7.32958 0.163688 7.2276 0.320372C7.12561 0.477057 7.09005 0.667837 7.12873 0.850744C7.16741 1.03365 7.27716 1.1937 7.43385 1.29568L8.48956 1.99483C6.31937 2.38155 4.36368 3.5438 2.98665 5.26517C1.60963 6.98653 0.905128 9.14968 1.00433 11.3518C1.10354 13.554 1.99968 15.645 3.5259 17.2356C5.05213 18.8262 7.1044 19.8079 9.30057 19.9979Z"></path>
                </svg>
              </div>
              <div>Flip &amp; Rotate</div>
            </div>
            <div className="ml- "></div>
          </div>
          <div>
            <h1>Convert Page</h1>
            {selectedFile && (
              <img src={URL.createObjectURL(selectedFile)} alt="Preview" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
