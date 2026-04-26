import express from 'express';
import { apHierarchy } from '../data/hierarchy.js';

const router = express.Router();

// Get full hierarchy
router.get('/', (req, res) => {
  res.json(apHierarchy);
});

// Get districts
router.get('/districts', (req, res) => {
  res.json(apHierarchy.districts.map(d => d.name));
});

// Get mandals by district
router.get('/mandals/:district', (req, res) => {
  const districtName = req.params.district.toLowerCase();
  const district = apHierarchy.districts.find(d => d.name.toLowerCase() === districtName);
  if (district) {
    res.json(district.mandals.map(m => m.name));
  } else {
    res.status(404).json({ message: "District not found" });
  }
});

// Get villages by mandal
router.get('/villages/:district/:mandal', (req, res) => {
  const districtName = req.params.district.toLowerCase();
  const mandalName = req.params.mandal.toLowerCase();
  
  const district = apHierarchy.districts.find(d => d.name.toLowerCase() === districtName);
  if (district) {
    const mandal = district.mandals.find(m => m.name.toLowerCase() === mandalName);
    if (mandal) {
      res.json(mandal.villages);
    } else {
      res.status(404).json({ message: "Mandal not found" });
    }
  } else {
    res.status(404).json({ message: "District not found" });
  }
});

export default router;
