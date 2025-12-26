import { db } from './db';
import { analyticsEvents, dealAnalytics, type InsertAnalyticsEvent } from '@shared/analyticsSchema';
import { eq, sql, and, gte } from 'drizzle-orm';

class AnalyticsService {
  // Track event
  async trackEvent(event: Omit<InsertAnalyticsEvent, 'id' | 'createdAt'>) {
    try {
      await db.insert(analyticsEvents).values(event);
      
      // Update deal analytics if it's a deal-related event
      if (event.dealId && ['view', 'join', 'abandon', 'share'].includes(event.eventType)) {
        await this.updateDealAnalytics(event.dealId);
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }

  // Update deal analytics (aggregated stats)
  private async updateDealAnalytics(dealId: string) {
    try {
      const stats = await this.calculateDealStats(dealId);
      
      const existing = await db.select()
        .from(dealAnalytics)
        .where(eq(dealAnalytics.dealId, dealId))
        .limit(1);

      if (existing.length > 0) {
        await db.update(dealAnalytics)
          .set({ ...stats, lastUpdated: new Date() })
          .where(eq(dealAnalytics.dealId, dealId));
      } else {
        await db.insert(dealAnalytics).values({
          dealId,
          ...stats,
        });
      }
    } catch (error) {
      console.error('Failed to update deal analytics:', error);
    }
  }

  // Calculate deal statistics
  private async calculateDealStats(dealId: string) {
    const events = await db.select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.dealId, dealId));

    const views = events.filter(e => e.eventType === 'view');
    const joins = events.filter(e => e.eventType === 'join');
    const abandons = events.filter(e => e.eventType === 'abandon');
    const shares = events.filter(e => e.eventType === 'share');

    const totalViews = views.length;
    const uniqueViews = new Set(views.map(e => e.sessionId || e.userId)).size;
    const totalJoins = joins.length;
    const conversionRate = totalViews > 0 ? Math.round((totalJoins / totalViews) * 10000) : 0;
    const abandonmentRate = (totalViews + totalJoins) > 0 
      ? Math.round((abandons.length / (totalViews + totalJoins)) * 10000) 
      : 0;

    return {
      totalViews,
      uniqueViews,
      totalJoins,
      conversionRate,
      abandonmentRate,
      shareCount: shares.length,
      totalRevenue: 0, // Will be calculated from actual deals
      averageOrderValue: 0,
    };
  }

  // Get analytics for a deal
  async getDealAnalytics(dealId: string): Promise<any> {
    const stats = await db.select()
      .from(dealAnalytics)
      .where(eq(dealAnalytics.dealId, dealId))
      .limit(1);

    if (stats.length === 0) {
      await this.updateDealAnalytics(dealId);
      return this.getDealAnalytics(dealId);
    }

    return stats[0];
  }

  // Get analytics for supplier (all their deals)
  async getSupplierAnalytics(supplierId: string, dealIds: string[]) {
    if (dealIds.length === 0) {
      return {
        totalViews: 0,
        uniqueVisitors: 0,
        totalJoins: 0,
        averageConversionRate: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topPerformingDeals: [],
      };
    }

    const stats = await db.select()
      .from(dealAnalytics)
      .where(sql`${dealAnalytics.dealId} = ANY(${dealIds})`);

    const totalViews = stats.reduce((sum, s) => sum + (s.totalViews || 0), 0);
    const totalJoins = stats.reduce((sum, s) => sum + (s.totalJoins || 0), 0);
    const totalRevenue = stats.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
    const averageConversionRate = stats.length > 0
      ? Math.round(stats.reduce((sum, s) => sum + (s.conversionRate || 0), 0) / stats.length)
      : 0;

    return {
      totalViews,
      uniqueVisitors: stats.reduce((sum, s) => sum + (s.uniqueViews || 0), 0),
      totalJoins,
      averageConversionRate: averageConversionRate / 100, // Convert back to percentage
      totalRevenue: totalRevenue / 100, // Convert from agorot to shekels
      averageOrderValue: totalJoins > 0 ? (totalRevenue / totalJoins) / 100 : 0,
      topPerformingDeals: stats
        .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
        .slice(0, 5)
        .map(s => ({
          dealId: s.dealId,
          views: s.totalViews,
          joins: s.totalJoins,
          revenue: (s.totalRevenue || 0) / 100,
          conversionRate: (s.conversionRate || 0) / 100,
        })),
    };
  }

  // Get time-series data (for charts)
  async getDealViewsOverTime(dealId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await db.select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.dealId, dealId),
          eq(analyticsEvents.eventType, 'view'),
          gte(analyticsEvents.createdAt, startDate)
        )
      );

    // Group by date
    const viewsByDate = new Map<string, number>();
    events.forEach(event => {
      const date = event.createdAt.toISOString().split('T')[0];
      viewsByDate.set(date, (viewsByDate.get(date) || 0) + 1);
    });

    return Array.from(viewsByDate.entries())
      .map(([date, count]) => ({ date, views: count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get conversion funnel
  async getConversionFunnel(dealId: string) {
    const events = await db.select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.dealId, dealId));

    const views = events.filter(e => e.eventType === 'view').length;
    const clicks = events.filter(e => e.eventType === 'click').length;
    const joins = events.filter(e => e.eventType === 'join').length;

    return {
      views,
      clicks,
      joins,
      viewToClick: views > 0 ? Math.round((clicks / views) * 100) : 0,
      clickToJoin: clicks > 0 ? Math.round((joins / clicks) * 100) : 0,
      viewToJoin: views > 0 ? Math.round((joins / views) * 100) : 0,
    };
  }
}

export const analyticsService = new AnalyticsService();
