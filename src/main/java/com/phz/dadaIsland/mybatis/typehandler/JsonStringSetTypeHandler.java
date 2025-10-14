package com.phz.dadaIsland.mybatis.typehandler;

import java.io.IOException;
import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedJdbcTypes;
import org.apache.ibatis.type.MappedTypes;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Converts between a JSON array column and a {@link Set} of strings.
 */
@MappedTypes(Set.class)
@MappedJdbcTypes({ JdbcType.VARCHAR, JdbcType.LONGVARCHAR, JdbcType.CLOB, JdbcType.OTHER })
public class JsonStringSetTypeHandler extends BaseTypeHandler<Set<String>> {

	private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
	private static final TypeReference<Set<String>> TYPE_REF = new TypeReference<>() {
	};

	@Override
	public void setNonNullParameter(PreparedStatement ps, int i, Set<String> parameter, JdbcType jdbcType) throws SQLException {
		ps.setString(i, writeJson(parameter));
	}

	@Override
	public Set<String> getNullableResult(ResultSet rs, String columnName) throws SQLException {
		return parseJson(rs.getString(columnName));
	}

	@Override
	public Set<String> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
		return parseJson(rs.getString(columnIndex));
	}

	@Override
	public Set<String> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
		return parseJson(cs.getString(columnIndex));
	}

	private static Set<String> parseJson(String json) throws SQLException {
		if (json == null || json.isBlank()) {
			return Collections.emptySet();
		}
		try {
			return new LinkedHashSet<>(OBJECT_MAPPER.readValue(json, TYPE_REF));
		} catch (IOException ex) {
			throw new SQLException("Failed to parse roles JSON: " + json, ex);
		}
	}

	private static String writeJson(Set<String> roles) throws SQLException {
		try {
			return OBJECT_MAPPER.writeValueAsString(roles);
		} catch (IOException ex) {
			throw new SQLException("Failed to serialize roles to JSON", ex);
		}
	}
}
