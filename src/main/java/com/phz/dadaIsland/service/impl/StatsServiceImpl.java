package com.phz.dadaIsland.service.impl;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phz.dadaIsland.dto.stats.StatsOverviewResponse;
import com.phz.dadaIsland.mapper.StatsMapper;
import com.phz.dadaIsland.service.StatsService;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class StatsServiceImpl implements StatsService {

	private static final String CACHE_KEY = "stats:overview";

	private final StatsMapper statsMapper;
	private final StringRedisTemplate redisTemplate;
	private final ObjectMapper objectMapper;
	private final Duration cacheTtl;

	public StatsServiceImpl(StatsMapper statsMapper,
			StringRedisTemplate redisTemplate,
			ObjectMapper objectMapper,
			@Value("${app.cache.stats-ttl:PT2M}") Duration cacheTtl) {
		this.statsMapper = statsMapper;
		this.redisTemplate = redisTemplate;
		this.objectMapper = objectMapper;
		this.cacheTtl = cacheTtl.isNegative() ? Duration.ofMinutes(2) : cacheTtl;
	}

	@Override
	@Transactional(readOnly = true)
	public StatsOverviewResponse getOverview() {
		StatsOverviewResponse cached = readFromCache();
		if (cached != null) {
			return cached;
		}
		long activeProjects = statsMapper.countActiveProjects();
		long creators = statsMapper.countUniqueCreators();
		long successfulLaunches = statsMapper.countSuccessfulLaunches();
		StatsOverviewResponse response = new StatsOverviewResponse(activeProjects, creators, successfulLaunches,
				Instant.now());
		writeToCache(response);
		return response;
	}

	private StatsOverviewResponse readFromCache() {
		try {
			String cached = redisTemplate.opsForValue().get(CACHE_KEY);
			if (cached == null) {
				return null;
			}
			return objectMapper.readValue(cached, StatsOverviewResponse.class);
		} catch (JsonProcessingException | DataAccessException ex) {
			log.warn("Failed to read stats overview from cache", ex);
			return null;
		}
	}

	private void writeToCache(StatsOverviewResponse response) {
		try {
			String payload = objectMapper.writeValueAsString(response);
			redisTemplate.opsForValue().set(CACHE_KEY, payload, cacheTtl);
		} catch (JsonProcessingException | DataAccessException ex) {
			log.warn("Failed to write stats overview cache", ex);
		}
	}
}
