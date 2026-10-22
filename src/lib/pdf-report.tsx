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
  Link,
  Image as PdfImage,
  StyleSheet,
} from '@react-pdf/renderer'
import type { DetectedHazard } from './mock-data'
import type { RegulationCitation } from './tavily'

// NVIDIA green brand color
const BRAND = '#76b900'

// Badge background colors (darker so white text is readable)
const SEVERITY_BADGE_BG: Record<string, string> = {
  CRITICAL: '#dc2626', // red-600 (darker)
  HIGH: '#ea580c',     // orange-600 (darker)
  MEDIUM: '#65a30d',   // lime-600 (darker — was amber-600, unreadable)
  LOW: '#059669',      // emerald-600 (darker)
}

// Badge text color — white for dark badges, dark for light
const SEVERITY_BADGE_TEXT: Record<string, string> = {
  CRITICAL: '#ffffff',
  HIGH: '#ffffff',
  MEDIUM: '#ffffff',
  LOW: '#ffffff',
}

// Category labels — human-readable (spaces instead of underscores)
const CATEGORY_LABELS: Record<string, string> = {
  PPE_VIOLATION: 'PPE Violation',
  FIRE_SMOKE: 'Fire / Smoke',
  SLIP_TRIP_FALL: 'Slip / Trip / Fall',
  UNAUTHORIZED_ZONE: 'Unauthorized Zone',
  MACHINERY_PROXIMITY: 'Machinery Proximity',
  UNSAFE_BEHAVIOR: 'Unsafe Behavior',
  OTHER: 'Other',
}

function formatCategory(category: string): string {
  return CATEGORY_LABELS[category] || category.replace(/_/g, ' ')
}

// Score colors — darker for readability on white background
const SCORE_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626', // red-600
  HIGH: '#d97706',      // amber-600 (was orange-600 — aligned with results view)
  LOW: '#047857',       // emerald-700
}

function riskLevel(score: number): string {
  if (score < 50) return 'HIGH RISK'
  if (score < 75) return 'MODERATE RISK'
  return 'LOW RISK'
}

function scoreColor(score: number): string {
  if (score < 50) return SCORE_COLORS.CRITICAL
  if (score < 75) return SCORE_COLORS.HIGH
  return SCORE_COLORS.LOW
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
    color: '#1a1a1a',
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
    color: '#555',
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
  citationCategory: {
    fontFamily: 'Courier-Bold',
    fontSize: 8,
    color: BRAND,
    marginTop: 8,
    marginBottom: 2,
  },
  citationItem: {
    fontSize: 8,
    color: '#333',
    marginBottom: 4,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#ddd',
    borderLeftStyle: 'solid',
  },
  citationTitle: {
    fontFamily: 'Courier-Bold',
    fontSize: 8,
    color: '#1a4a7a',
    textDecoration: 'underline',
  },
  citationUrl: {
    fontSize: 7,
    color: '#888',
    marginTop: 1,
  },
  citationContent: {
    fontSize: 7.5,
    color: '#555',
    lineHeight: 1.4,
    marginTop: 2,
  },
})

interface PdfReportProps {
  score: number
  sceneDescription: string
  hazards: DetectedHazard[]
  regulations: RegulationCitation[]
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
  regulations,
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
    category: '14%',
    severity: '11%',
    description: '33%',
    recommendation: '30%',
    confidence: '12%',
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
            <Text style={[styles.tableHeaderText, { width: colWidths.category }]}>Category</Text>
            <Text style={[styles.tableHeaderText, { width: colWidths.severity }]}>Severity</Text>
            <Text style={[styles.tableHeaderText, { width: colWidths.description }]}>Description</Text>
            <Text style={[styles.tableHeaderText, { width: colWidths.recommendation }]}>Recommendation</Text>
            <Text style={[styles.tableHeaderText, { width: colWidths.confidence }]}>Confidence</Text>
          </View>
          {/* Table rows */}
          {sortedHazards.map((hazard, idx) => (
            <View
              key={hazard.id || idx}
              style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
            >
              <Text style={[styles.tableCell, { width: colWidths.category }]}>
                {formatCategory(hazard.category)}
              </Text>
              <View style={[styles.tableCell, { width: colWidths.severity }]}>
                <Text
                  style={[
                    styles.badge,
                    {
                      backgroundColor: SEVERITY_BADGE_BG[hazard.severity] || '#666',
                      color: SEVERITY_BADGE_TEXT[hazard.severity] || '#fff',
                    },
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

      {/* Page 2: Regulations & Citations (only if there are any) */}
      {regulations.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionLabel}>
            {'// Regulations & Citations (' + regulations.length + ' categories)'}
          </Text>
          <Text style={[styles.body, { marginBottom: 8, color: '#666' }]}>
            Sourced via Tavily Live Search · cross-referenced with EU directives, Czech regulations, and ISO standards.
          </Text>
          {regulations.map((reg) => (
            <View key={reg.hazard_category} wrap={false}>
              <Text style={styles.citationCategory}>
                {formatCategory(reg.hazard_category)}
              </Text>
              {reg.results.map((r, idx) => (
                <View key={idx} style={styles.citationItem}>
                  <Link src={r.url} style={styles.citationTitle}>
                    {r.title}
                  </Link>
                  <Text style={styles.citationUrl}>{r.url}</Text>
                  <Text style={styles.citationContent}>{r.content}</Text>
                </View>
              ))}
            </View>
          ))}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {'// MIT licensed · Runs on Nebius Token Factory · NVIDIA Nemotron'}
            </Text>
            <Text style={styles.footerText}>{'// page 2'}</Text>
          </View>
        </Page>
      )}
    </Document>
  )
}
