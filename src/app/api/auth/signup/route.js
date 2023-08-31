import bcrypt from "bcryptjs";
import Joi from "joi";
import dbConnect from "../../../../../lib/dbConnect";
import User from "../../../../../models/User";
import { NextResponse } from "next/server";


const socialSchema = Joi.object({
  linkedIn: Joi.string().allow("").optional(),
  twitter: Joi.string().allow("").optional(),
  instagram: Joi.string().allow("").optional(),
  facebook: Joi.string().allow("").optional(),
  github: Joi.string().allow("").optional(),
});

const personalSchema = Joi.object({
  location: Joi.string().max(60).allow("").optional(),
  company: Joi.string().max(60).allow("").optional(),
  bio: Joi.string().max(600).allow("").optional(),
});

const usersSchema = Joi.object({
  name: Joi.string().min(4).max(60).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(100),
  image: Joi.string().default(
    "https://res.cloudinary.com/dhk9gwc4q/image/upload/v1690988668/samples/animals/three-dogs.jpg"
  ),
  socials: Joi.array().items(socialSchema),
  personalInfo: Joi.array().items(personalSchema),
  role: Joi.string().default("user"),
});


export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  let users;
  if (id) {
    users = await User.findById(id);
    if (!users) {
      return NextResponse.json(
        { message: "User not found 💩" },
        { status: 404 }
      );
    }
    return NextResponse.json({ users }, { status: 200 });
  } else {
    users = await User.find();
    return NextResponse.json({ users }, { status: 200 });
  }
}

export async function POST(request) {
  await dbConnect();
  try {
    const res = await request.json();
    const { error, value } = usersSchema.validate(res);

    if (error) {
      return NextResponse.json(
        { message: "Invalid User input 💩", details: error.details },
        { status: 400 }
      );
    }

    const { name, email, password, image, socials, personalInfo, role } = value;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { message: "The user already exists ☹️" },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword, image, socials, personalInfo, role });
    const savedUser = await user.save();

    return NextResponse.json("User created successfully 👽", { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

export async function PUT(request) {
  await dbConnect();
  try {
    const res = await request.json();
    const { error, value } = usersSchema.validate(res);
    if (error) {
      return NextResponse.json(
        { message: "Invalid User input 💩", details: error.details },
        { status: 400 }
      );
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const { name, email, password, image, socials, personalInfo, role } = value;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.findByIdAndUpdate(
      id,
      { name, email, password: hashedPassword, image, socials, personalInfo, role },
      { new: true, runValidator: true }
    );
    if (!user) {
      return NextResponse.json({ message: "User not found 💩" });
    }
    return NextResponse.json({message:"User updated successfully! 👻", user }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

export async function DELETE(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json(
        { message: "User not found 💩" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "User deleted successfully 👽" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
