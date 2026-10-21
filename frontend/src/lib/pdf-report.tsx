/**
 * PDF report layout for Hazsight safety audit reports.
 *
 * Uses @react-pdf/renderer to render a React component tree into a PDF.
 * Works on Vercel (Node.js serverless, no native deps needed).
 *
 * The PDF includes:
 * - Header (Hazsight branding + timestamp)
 * - Overall safety score (big number + risk level, colored by severity)
 * - Scene description
 * - Detected hazards table (category, severity, description, recommendation, confidence)
 * - Footer (compliance line + page number)
 *
 * If an image is available (base64 from upload or fetched from /public),
 * it's included before the hazard table.
 */

import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  Image as PdfImage,
  StyleSheet,
} from '@react-pdf/renderer'
import type { DetectedHazard } from './mock-data'

// NVIDIA green brand color
const BRAND = '#76b900'
const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#facc15',
  LOW: '#10b981',
}

const SEVERITY_BG: Record<string, string> = {
  CRITICAL: '#fef2f2',
  HIGH: '#fff7ed',
  MEDIUM: '#fefce8',
  LOW: '#ecfdf5',
}

function riskLevel(score: number): string {
  if (score < 40) return 'HIGH RISK'
  if (score < 70) return 'MODERATE RISK'
  return 'LOW RISK'
}

function scoreColor(score: number): string {
  if (score < 40) return SEVERITY_COLORS.CRITICAL
  if (score < 70) return SEVERITY_COLORS.HIGH
  return SEVERITY_COLORS.LOW
}

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  brandLine: {
    fontFamily: 'Courier',
    fontSize: 7,
    color: '#666',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Courier-Bold',
    fontSize: 24,
    color: BRAND,
  },
  subtitle: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: 'Courier',
    fontSize: 8,
    color: BRAND,
    marginBottom: 4,
    marginTop: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  scoreBig: {
    fontFamily: 'Courier-Bold',
    fontSize: 48,
    marginBottom: 2,
  },
  scoreLabel: {
    fontFamily: 'Courier',
    fontSize: 12,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333',
  },
  small: {
    fontSize: 8,
    color: '#666',
  },
  image: {
    width: '100%',
    maxHeight: 300,
    objectFit: 'contain',
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND,
    padding: 6,
  },
  tableHeaderText: {
    color: '#fff',
    fontFamily: 'Courier-Bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  tableRowAlt: {
    backgroundColor: '#f7f7f7',
  },
  tableCell: {
    fontSize: 8,
    color: '#333',
    paddingRight: 4,
  },
  badge: {
    fontFamily: 'Courier-Bold',
    fontSize: 7,
    padding: 2,
    borderRadius: 2,
    color: '#fff',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 0.5,
    borderTopColor: BRAND,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontFamily: 'Courier',
    fontSize: 7,
    color: '#999',
  },
})

interface PdfReportProps {
  score: number
  sceneDescription: string
  hazards: DetectedHazard[]
  imageData: string | null // base64 data URL or null
  jobId: string
  createdAt: string
}

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
}

export function PdfReport({
  score,
  sceneDescription,
  hazards,
  imageData,
  jobId,
  createdAt,
}: PdfReportProps) {
  const sortedHazards = [...hazards].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] || 4) - (SEVERITY_ORDER[b.severity] || 4),
  )
  const level = riskLevel(score)
  const color = scoreColor(score)

  const colWidths = {
    category: '15%',
    severity: '12%',
    description: '35%',
    recommendation: '30%',
    confidence: '8%',
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandLine}>
            {'// Team DAMR58H · Nebius x NVIDIA Global AI Hackathon · Best Apps & Agents'}
          </Text>
          <Text style={styles.title}>Safety Audit Report</Text>
          <Text style={styles.subtitle}>
            Hazsight — AI Safety Inspector · NVIDIA Nemotron on Nebius Token Factory
          </Text>
          <Text style={[styles.small, { marginTop: 4 }]}>
            {'// Generated: ' + createdAt + ' · Job: ' + jobId}
          </Text>
        </View>

        {/* Safety Score */}
        <Text style={styles.sectionLabel}>{'// Overall Safety Score'}</Text>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreBig, { color }]}>
            {score} / 100
          </Text>
          <Text style={[styles.scoreLabel, { color }]}>{level}</Text>
        </View>

        {/* Scene Description */}
        <Text style={styles.sectionLabel}>{'// Scene Description'}</Text>
        <Text style={styles.body}>{sceneDescription}</Text>

        {/* Image (if available) */}
        {imageData && (
          <>
            <Text style={styles.sectionLabel}>{'// Analyzed Image'}</Text>
            <PdfImage style={styles.image} src={imageData} />
          </>
        )}

        {/* Hazard Table */}
        <Text style={styles.sectionLabel}>
          {'// Detected Hazards (' + hazards.length + ')'}
        </Text>
        <View>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: colWidths.category }]}>CATEGORY</Text>
            <Text style={[styles.tableHeaderText, { width: colWidths.severity }]}>SEVERITY</Text>
            <Text style={[styles.tableHeaderText, { width: colWidths.description }]}>DESCRIPTION</Text>
            <Text style={[styles.tableHeaderText, { width: colWidths.recommendation }]}>RECOMMENDATION</Text>
            <Text style={[styles.tableHeaderText, { width: colWidths.confidence }]}>CONF.</Text>
          </View>
          {/* Table rows */}
          {sortedHazards.map((hazard, idx) => (
            <View
              key={hazard.id || idx}
              style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
            >
              <Text style={[styles.tableCell, { width: colWidths.category }]}>
                {hazard.category}
              </Text>
              <View style={[styles.tableCell, { width: colWidths.severity }]}>
                <Text
                  style={[
                    styles.badge,
                    { backgroundColor: SEVERITY_COLORS[hazard.severity] || '#666' },
                  ]}
                >
                  {hazard.severity}
                </Text>
              </View>
              <Text style={[styles.tableCell, { width: colWidths.description }]}>
                {hazard.description}
              </Text>
              <Text style={[styles.tableCell, { width: colWidths.recommendation }]}>
                {hazard.recommendation}
              </Text>
              <Text style={[styles.tableCell, { width: colWidths.confidence }]}>
                {Math.round(hazard.confidence * 100)}%
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {'// MIT licensed · Runs on Nebius Token Factory · NVIDIA Nemotron'}
          </Text>
          <Text style={styles.footerText}>{'// page 1'}</Text>
        </View>
      </Page>
    </Document>
  )
}
