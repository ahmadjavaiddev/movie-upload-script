import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    movieId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    src: {
      type: String,
    },
    backdrop: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "PENDING",
      enum: ["PENDING", "PUBLISH", "TESTING"],
    },
    genre: [
      {
        type: String,
      },
    ],
    cast: {
      type: String,
    },
    description: {
      type: String,
    },
    year: {
      type: String,
    },
    thismovieis: {
      type: String,
    },
    director: {
      type: String,
    },
    // episodes: [
    //   {
    //     episodeId: {
    //       type: String,
    //     },
    //     episodeNumber: {
    //       type: String,
    //     },
    //     episodeName: {
    //       type: String,
    //     },
    //     ep_desc: {
    //       type: String,
    //     },
    //     season: {
    //       type: String,
    //     },
    //   },
    // ],
    // sources: [
    //   {
    //     src: {
    //       type: String,
    //     },
    //     label: {
    //       type: String,
    //     },
    //     default: {
    //       type: Boolean,
    //       default: false,
    //     },
    //   },
    // ],
  },
  { timestamps: true }
);

const MovieModel = mongoose.model("Movie", movieSchema);

export default MovieModel;
