import AgriCustomer from '../models/AgriCustomerSchema.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Helper function to generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '1h' });
};

// AgriCustomer Registration
export const registerAgriCustomer = async (req, res) => {
    const { name, email, password, phone, deliveryAddress, favoriteProducts } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const customer = new AgriCustomer({
            name,
            email,
            password: hashedPassword,
            phone,
            deliveryAddress,
            favoriteProducts,
        });
        await customer.save();
        res.status(201).json({ message: 'AgriCustomer registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error registering customer: ' + error.message });
    }
};

// AgriCustomer Login
export const loginAgriCustomer = async (req, res) => {
    const { email, password } = req.body;
    try {
        const customer = await AgriCustomer.findOne({ email });
        if (!customer) {
            return res.status(404).json({ error: 'AgriCustomer not found' });
        }
        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = generateToken(customer._id);
        res.status(200).json({ token, customer: { id: customer._id, name: customer.name, email: customer.email } });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in customer: ' + error.message });
    }
};
