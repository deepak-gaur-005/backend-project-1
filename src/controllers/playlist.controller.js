import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if (!name?.trim()) {
        throw new ApiError(400, "Playlist name is required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(
            201,
            playlist,
            "Playlist created successfully",
        )
    );

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

    const playlists = await Playlist.find({
        owner: userId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlists,
            "Playlists fetched successfully",

        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        }
    ])

    if (!playlist.length) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist[0],
            "Playlist fetched successfully",
            
        )
    )
})

const addVideoToPlaylist = asyncHandler(async ( req, res) => {
    const {playlistId, videoId} = req.params

    if (
        !isValidObjectId(playlistId) ||
        !isValidObjectId(videoId)
    ) {
        throw new ApiError(400, "Invalid id");
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    if (playlist.videos.some((id) => id.toString() === videoId)) {
        throw new ApiError(400, "Video already exists in playlist");
    }
    
    playlist.videos.push(videoId);

    await playlist.save()

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Video added successfully",
            
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async( req, res) => {
    const {playlistId, videoId} = req.params

    if (
        !isValidObjectId(playlistId) ||
        !isValidObjectId(videoId)
    ) {
        throw new ApiError(400, "Invalid id");
    }


    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    playlist.videos.pull(videoId);

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Video removed successfully"
        )
    );
})

const deletePlaylist = asyncHandler(async( req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Playlist deleted successfully",
            
        )
    );

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized")
    }

    playlist.name = name || playlist.name
    playlist.description = description || playlist.description

    await playlist.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist updated successfully",
        )
    )
})


export{
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
