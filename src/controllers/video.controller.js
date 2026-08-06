import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination

    const match = {
        isPublished: true
    }

    if (query) {
        match.title = {
            $regex: query,
            $options: "i"
        }
    }

    if(userId && isValidObjectId(userId)) {
        match.owner = new mongoose.Types.ObjectId(userId);
    }

    const aggregate = Video.aggregate(
        [
            { 
                $match: match 
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                fullNname: 1,
                                username: 1,
                                avatar: 1
                            }
                        }
                    ]
                } 
            },
            {
                $addFields: {
                    owner: {
                        $first: "$owner"
                    }
                }
            },
            {
                $sort: {
                    [sortBy]: sortType === "asc" ? 1 : -1,
                }
            }
        ]
    );

    const fetchedvideos = await Video.aggregatePaginate(aggregate, {
        limit: Number(limit),
        page: Number(page),
    });

    return res
    .status(200)
    .json(
        new ApiResponse(200, fetchedvideos, "Videos fetched successfully",)
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description,} = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailFileLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnailFileLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const videofile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath)

    if (!videofile) {
        throw new ApiError(500, "Video upload failed")
    }

    if (!thumbnail) {
        throw new ApiError(500, "Thumbnail upload failed")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videofile.url,
        thumbnail: thumbnail.url,
        duration: videofile.duration,
        owner: req.user._id,
        isPublished: true
    })

    const publishedVideo = await Video.findById(video._id);

    if (!publishedVideo) {
        throw new ApiError(500, "something went wrong while publishing the video")      
    }

    return res
    .status(201)
    .json(
        new ApiResponse(201, publishedVideo, "Video published successfully",)    
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId} = req.params
    // TODO: get video by id
    
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ])

    if (!video.length) {
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video[0], "Video fetched successfully")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // TODO: update video details like title , description, thumbnail
    const{ title, description} = req.body;

    console.log(req.body);
    console.log(req.file);

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const thumbnailFileLocalPath = req.file?.path;
    if(!thumbnailFileLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath)

    if(!thumbnail) {
        throw new ApiError(500, "thumbnail upload failed")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url
            }
        },
        {
            new: true
        }
    )

    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video updated successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    // TODO: Delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }

    const video = await Video.findById(videoId)
    
    if(!video) {
        throw new ApiError(404, "video not found")
    }

    if(video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this video")
    }

    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(404, "video not found")
    }

    //check is thelogged in user is the owner of the video

    if(video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you are not the owner of this video")
    }

    video.isPublished = !video.isPublished

    await video.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        `Video ${video.isPublished ? "published" : "unpublished"} successfully`,
    ))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}