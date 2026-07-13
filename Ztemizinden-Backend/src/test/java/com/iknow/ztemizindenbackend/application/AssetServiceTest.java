package com.iknow.ztemizindenbackend.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.iknow.ztemizindenbackend.domain.Asset;
import com.iknow.ztemizindenbackend.domain.AssetRepository;
import com.iknow.ztemizindenbackend.domain.BadRequestException;
import com.iknow.ztemizindenbackend.domain.Enums.AssetType;
import com.iknow.ztemizindenbackend.domain.TicketRepository;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Collection;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class AssetServiceTest {
    private boolean deleteCalled;

    @Test
    void rejectsSubtreeDeletionWhenAChildHasTicketHistory() {
        Asset parent = asset("parent");
        Asset child = asset("child");
        parent.addChild(child);

        AssetRepository assetRepository = repositoryProxy(AssetRepository.class, (proxy, method, args) -> {
            return switch (method.getName()) {
                case "findById" -> Optional.of(parent);
                case "delete" -> {
                    deleteCalled = true;
                    yield null;
                }
                default -> throw new UnsupportedOperationException(method.getName());
            };
        });
        TicketRepository ticketRepository = repositoryProxy(TicketRepository.class, (proxy, method, args) -> {
            if ("existsByAssetIdIn".equals(method.getName())) {
                Collection<?> ids = (Collection<?>) args[0];
                assertThat(ids.stream().map(Object::toString).toList()).containsExactly("parent", "child");
                return true;
            }
            throw new UnsupportedOperationException(method.getName());
        });
        AssetService assetService = new AssetService(assetRepository, ticketRepository);

        assertThatThrownBy(() -> assetService.delete("parent"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("service tickets");
        assertThat(deleteCalled).isFalse();
    }

    private Asset asset(String id) {
        Asset asset = new Asset(
                "cust-1", id, "TAG-" + id, AssetType.FACILITY,
                "Brand", "Model", "SN-" + id,
                null, null, "Istanbul", "Maintenance", null
        );
        ReflectionTestUtils.setField(asset, "id", id);
        return asset;
    }

    private static <T> T repositoryProxy(Class<T> type, InvocationHandler handler) {
        Object proxy = Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class<?>[]{type},
                (target, method, args) -> {
                    if (method.getDeclaringClass() == Object.class) {
                        return objectMethod(target, method, args);
                    }
                    return handler.invoke(target, method, args);
                }
        );
        return type.cast(proxy);
    }

    private static Object objectMethod(Object target, Method method, Object[] args) {
        return switch (method.getName()) {
            case "toString" -> "repository test proxy";
            case "hashCode" -> System.identityHashCode(target);
            case "equals" -> target == args[0];
            default -> throw new UnsupportedOperationException(method.getName());
        };
    }
}
