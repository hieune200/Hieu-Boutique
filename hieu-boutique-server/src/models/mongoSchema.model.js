const userSchema = {
    username: String,
    password: String,
    name: String,
    sex: String,
    birthday: Date,
    email: String,
    phoneNumber: Number,
    address: String,
    avatar: String,
    role: "user",
    order: Object,
    loyaltyPoints: { type: Number, default: 0 },
    isVIP: { type: Boolean, default: false },
}

export { userSchema }