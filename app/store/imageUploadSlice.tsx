// imageUploadSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface ImageUploadState {
  uploadUrl: string | null;
  signature: string | null;
  selectedFile: File | null;
  previewUrl: string | null;
  jobId: string | null;
  
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}



export const handleUpload = createAsyncThunk<
  {
    uploadUrl: string;
    signature: string;
    jobId: string;
  },
  void,
  {
    rejectValue: string;
    state: RootState;
  }
>(
  "imageUpload/handleUpload",
  async (_, { rejectWithValue, getState }) => {
    try {
      const currentState = getState();

      const tokenResponse = await fetch(
        "https://dev-api.freeconvert.com/v1/account/guest"
      );
      const token = await tokenResponse.text();

      const response = await fetch(
        "https://dev-api.freeconvert.com/v1/process/jobs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer api_dev_18c56fe7e4395cd9fb7f1ee3b8329e300bd71596130fca196c8b0806ecc3ed34.61d077db9a791d0011cd36c1.6734849f6d3fcae9e29a3bce`,
          },
          body: JSON.stringify({
            tasks: {
              "import-1": { operation: "import/upload" },
              "convert-1": {
                operation: "convert",
                input: "import-1",
                input_format: "jpg",
                output_format: "jpg",
                options: {
                  resize_type_image: "dimension",
                  // image_custom_width: getValidDimension(width),
                  // image_custom_height: getValidDimension(height),
                  jpg_convert_compress_method: "no_change",
                  "auto-orient": true,
                  strip: true,
                },
              },
              "export-1": { operation: "export/url", input: ["convert-1"] },
            },
          }),
        }
      );

      const jsonResponse = await response.json();
      console.log("Response:", jsonResponse);

      if (!response.ok) {
        throw new Error(jsonResponse.message || "Upload failed");
      }

      return {
        uploadUrl: jsonResponse.tasks[0].result.form.url,
        signature: jsonResponse.tasks[0].result.form.parameters.signature,
        jobId: jsonResponse.id,
      };
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);


const imageUploadSlice = createSlice({
  name: "imageUpload",
  initialState: {
    uploadUrl: null,
    signature: null,
    selectedFile: null,
    previewUrl: null,
    jobId: null,
    width: null,
    height: null,
    status: "idle",
    error: null,
  } as ImageUploadState,
  reducers: {
    setSelectedFile: (state, action) => {
      state.selectedFile = action.payload;
      if (state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl);
      }
      state.previewUrl = action.payload
        ? URL.createObjectURL(action.payload)
        : null;
    },
    
  },
  extraReducers: (builder) => {
    builder
      .addCase(handleUpload.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(handleUpload.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.uploadUrl = action.payload.uploadUrl;
        state.signature = action.payload.signature;
        state.jobId = action.payload.jobId;
      })
      .addCase(handleUpload.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Upload failed";
      });
  },
});

export const {
  setSelectedFile,
} = imageUploadSlice.actions;
export const selectImageUpload = (state: RootState) => state.imageUpload;
export default imageUploadSlice.reducer;