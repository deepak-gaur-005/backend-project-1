import mongooose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import { ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body

    if (!content?.trim()) {  // trim() removes whitespaces from the beginning and end
        throw new ApiError(400, "content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    if (!tweet) {
        throw new ApiError(500, "something went wrong while creating the tweet")
    }

    return res
    .status(201)
    .json (
        new ApiResponse(201, tweet, "tweet created successfully",)
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "invalid user id");
    }

    const tweets = await Tweet.find({
        owner: userId
    })
    .sort({ createdAt: -1 })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweets,
                "Tweets fetched successfully"
            )
        );
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "invalid tweet id")
    }

    if(!content?.trim()) {
        throw new ApiError(400, "content is required")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "tweet not found")
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you are not the owner of this tweet")

    }

    tweet.content = content
    await tweet.save({
        validateBeforeSave: false
    })

    return res.status(200).json(
        new ApiResponse(
            200,
            tweet,
            "Tweet updated successfully"
        )
    )
})


const deleteTweet = asyncHandler(async (req, res) => {
    
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "invalid tweet id")
    }

    await Tweet.findByIdAndDelete(tweetId)
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Tweet deleted successfully"
        )
    )
})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}