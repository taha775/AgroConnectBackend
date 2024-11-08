import Farmer from '../models/FarmersSchema.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Helper function to generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '1h' });
};

// Farmer Registration
export const registerFarmer = async (req, res) => {
    const { name, email, password, farmName, farmLocation, phone, products } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const farmer = new Farmer({
            name,
            email,
            password: hashedPassword,
            farmName,
            farmLocation,
            phone,
            products,
        });
        await farmer.save();
        res.status(201).json({ message: 'Farmer registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error registering farmer: ' + error.message });
    }
};

// Farmer Login
export const loginFarmer = async (req, res) => {
    const { email, password } = req.body;
    try {
        const farmer = await Farmer.findOne({ email });
        if (!farmer) {
            return res.status(404).json({ error: 'Farmer not found' });
        }
        const isMatch = await bcrypt.compare(password, farmer.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = generateToken(farmer._id);
        res.status(200).json({ token, farmer: { id: farmer._id, name: farmer.name, email: farmer.email } });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in farmer: ' + error.message });
    }
};
