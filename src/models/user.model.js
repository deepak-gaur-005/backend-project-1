import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, //cloudinary url
            required: true,
        },
        coverimage: {
            type: String, //cloudinary url
        },
        watchHistory: [ 
            {
                type: Schema.Types.ObjectId,
                ref: "video"
            }
             
        ],
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6
        },
        refreshToken: {
            type: String,
        }
    },
    {
        timestamps: true,


})

userSchema.pre("save", async function (next) {

    // if(this.isModified("password")) {
    //     this.password = bcrypt.hash(this.password, 10);
    // }

    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password, 10);
    next();   // this encrypts the password before saving the user document to the database. It checks if the password field has been modified, and if so, it hashes the password using bcrypt with a salt round of 10. After hashing, it calls next() to proceed with saving the document.
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function(){
    jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}

userSchema.methods.generateRefreshToken = function() {
    jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}
    

export const User = mongoose.model("User", userSchema);