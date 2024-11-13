import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface ImageUploadState {
  uploadUrl: string | null;
  signature: string | null;
  selectedFile: File | null;
  previewUrl: string | null;
  jobId: string | null;
  width: number | null;
  height: number | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const getValidDimension = (value: number | null): number => {
  if (value === null || value <= 0) {
    return 100;
  }
  return value;
};

interface UploadThunkConfig {
  state: RootState;
}

export const handleUpload = createAsyncThunk<
  {
    uploadUrl: string;
    signature: string;
    jobId: string;
  },
  File,
  {
    rejectValue: string;
    state: RootState;
  }
>(
  "imageUpload/handleUpload",
  async (file: File, { rejectWithValue, getState }) => {
    try {
      const currentState = getState();
      const { width, height } = currentState.imageUpload;

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
            Authorization: `Bearer ${token}`,
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
                  image_custom_width: getValidDimension(width),
                  image_custom_height: getValidDimension(height),
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

      const jobId = jsonResponse.id;
      const uploadUrl = jsonResponse.tasks[0].result.form.url;
      const signature = jsonResponse.tasks[0].result.form.parameters.signature;

      return { uploadUrl, signature, jobId };
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
    setWidth: (state, action) => {
      state.width = action.payload;
    },
    setHeight: (state, action) => {
      state.height = action.payload;
    },
    setDimensions: (state, action) => {
      state.width = action.payload.width;
      state.height = action.payload.height;
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

export const { setSelectedFile, setWidth, setHeight } =
  imageUploadSlice.actions;
export const selectImageUpload = (state: RootState) => state.imageUpload;
export default imageUploadSlice.reducer;
